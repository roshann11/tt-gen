import Faculty from "../models/faculty";
import Room from "../models/room";
import Lab from "../models/lab";
import Subject from "../models/subject";
import TimeSlot from "../models/timeslot";
import Timetable from "../models/timetable";

interface SlotEntry {
  day: string;
  slotNumber: number;
  startTime: string;
  endTime: string;
  subject: string;
  type: "lecture" | "lab";
  faculty: string;
  room: string;
}

interface FacultyLoad {
  [facultyName: string]: {
    total: number;
    perDay: { [day: string]: number };
  };
}

interface NormalizedSlot {
  day: string;
  slotNumber: number;
  startTime: string;
  endTime: string;
}

interface TempBooking {
  day: string;
  slotNumber: number;
  faculty: string;
  room: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MAX_PER_DAY = 2;

const DAY_MAP: Record<string, string> = {
  mon: "Monday",
  monday: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  wed: "Wednesday",
  weds: "Wednesday",
  wednesday: "Wednesday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  fri: "Friday",
  friday: "Friday",
  sat: "Saturday",
  saturday: "Saturday",
};

const normalizeDay = (value: unknown): string => {
  if (!value) return "";
  const raw = String(value).trim();
  const key = raw.toLowerCase();
  return DAY_MAP[key] || raw;
};

const normalizeSemester = (value: unknown): number => {
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : NaN;
};

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const pickText = (...values: unknown[]): string => {
  for (const v of values) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
};

export async function generateTimetable() {
  const [faculties, rooms, labs, subjects, rawTimeSlots] = await Promise.all([
    Faculty.find().lean(),
    Room.find().lean(),
    Lab.find().lean(),
    Subject.find().lean(),
    TimeSlot.find().lean(),
  ]);

  if (!faculties.length || !rooms.length || !subjects.length || !rawTimeSlots.length) {
    throw new Error("Missing data: ensure faculty, rooms, subjects, and time slots are populated.");
  }

  const timeSlots: NormalizedSlot[] = rawTimeSlots
    .map((slot: any) => {
      const day = normalizeDay(slot.day);
      const slotNumber = Number(slot.slotNumber ?? slot.period);
      const startTime = pickText(slot.startTime, slot.start, "");
      const endTime = pickText(slot.endTime, slot.end, "");
      if (!day || !Number.isFinite(slotNumber)) return null;
      return { day, slotNumber, startTime, endTime };
    })
    .filter(Boolean) as NormalizedSlot[];

  if (!timeSlots.length) {
    throw new Error("No valid time slots found. Check day and slotNumber/period values.");
  }

  const dayOrder = (day: string) => {
    const idx = DAYS.indexOf(day);
    return idx === -1 ? 999 : idx;
  };

  timeSlots.sort((a, b) => dayOrder(a.day) - dayOrder(b.day) || a.slotNumber - b.slotNumber);

  const slotsByDay: Record<string, NormalizedSlot[]> = {};
  for (const slot of timeSlots) {
    if (!slotsByDay[slot.day]) slotsByDay[slot.day] = [];
    slotsByDay[slot.day].push(slot);
  }

  const availableDays = Object.keys(slotsByDay);

  const facultyNames = faculties
    .map((f: any) => pickText(f.shortName, f.name, f.code))
    .filter(Boolean);

  const roomNames = rooms.map((r: any) => pickText(r.name, r.roomName)).filter(Boolean);
  const labNames = labs.map((l: any) => pickText(l.name, l.labName)).filter(Boolean);

  if (!facultyNames.length) throw new Error("No valid faculty names found.");
  if (!roomNames.length) throw new Error("No valid room names found.");

  const facultyLoad: FacultyLoad = {};
  for (const fac of facultyNames) {
    facultyLoad[fac] = { total: 0, perDay: {} };
    for (const d of [...new Set([...DAYS, ...availableDays])]) {
      facultyLoad[fac].perDay[d] = 0;
    }
  }

  const occupiedFaculty: Record<string, Set<string>> = {};
  const occupiedRoom: Record<string, Set<string>> = {};

  const slotKey = (day: string, slotNum: number) => `${day}-${slotNum}`;

  const tempDayLoad = (temp: TempBooking[], faculty: string, day: string) =>
    temp.filter((b) => b.faculty === faculty && b.day === day).length;

  const isAvailable = (
    day: string,
    slotNum: number,
    facultyName: string,
    roomName: string,
    tempBookings: TempBooking[],
  ) => {
    const key = slotKey(day, slotNum);
    if (occupiedFaculty[key]?.has(facultyName)) return false;
    if (occupiedRoom[key]?.has(roomName)) return false;

    const tempConflict = tempBookings.some(
      (b) =>
        b.day === day &&
        b.slotNumber === slotNum &&
        (b.faculty === facultyName || b.room === roomName),
    );
    if (tempConflict) return false;

    const currentDayLoad = facultyLoad[facultyName]?.perDay[day] ?? 0;
    if (currentDayLoad + tempDayLoad(tempBookings, facultyName, day) >= MAX_PER_DAY) return false;

    return true;
  };

  const bookGlobal = (day: string, slotNum: number, facultyName: string, roomName: string) => {
    const key = slotKey(day, slotNum);
    if (!occupiedFaculty[key]) occupiedFaculty[key] = new Set();
    if (!occupiedRoom[key]) occupiedRoom[key] = new Set();

    occupiedFaculty[key].add(facultyName);
    occupiedRoom[key].add(roomName);

    facultyLoad[facultyName].total += 1;
    facultyLoad[facultyName].perDay[day] += 1;
  };

  const semesters = [...new Set(subjects.map((s: any) => normalizeSemester(s.semester)).filter(Number.isFinite))].sort(
    (a, b) => a - b,
  );

  if (!semesters.length) throw new Error("No valid semester values found in subjects.");

  const results: any[] = [];

  for (const sem of semesters) {
    const semSubjects = subjects.filter((s: any) => normalizeSemester(s.semester) === sem);
    if (!semSubjects.length) continue;

    const entries: SlotEntry[] = [];

    for (const subj of semSubjects) {
      const subjectName = pickText(subj.code, subj.name, subj.subjectCode, "Unknown");
      const requiredLectures = Math.max(0, Number(subj.lecturesPerWeek ?? 3));
      const requiredLabs = subj.hasLab ? Math.max(0, Number(subj.labsPerWeek ?? 1)) : 0;

      let assigned = false;

      const sortedFaculty = [...facultyNames].sort(
        (a, b) => (facultyLoad[a]?.total ?? 0) - (facultyLoad[b]?.total ?? 0),
      );

      for (const facultyName of sortedFaculty) {
        const tempBookings: TempBooking[] = [];
        const tempEntries: SlotEntry[] = [];

        let lecturesBooked = 0;
        let labsBooked = 0;

        const days = shuffle(availableDays);

        // Pass 1: try 1 lecture per day (spread)
        for (const day of days) {
          if (lecturesBooked >= requiredLectures) break;
          const daySlots = slotsByDay[day] ?? [];

          let booked = false;
          for (const slot of daySlots) {
            const roomName = roomNames.find((r) =>
              isAvailable(day, slot.slotNumber, facultyName, r, tempBookings),
            );
            if (!roomName) continue;

            tempBookings.push({ day, slotNumber: slot.slotNumber, faculty: facultyName, room: roomName });
            tempEntries.push({
              day,
              slotNumber: slot.slotNumber,
              startTime: slot.startTime,
              endTime: slot.endTime,
              subject: subjectName,
              type: "lecture",
              faculty: facultyName,
              room: roomName,
            });
            lecturesBooked++;
            booked = true;
            break;
          }
          if (!booked) continue;
        }

        // Pass 2: fill remaining lectures from any free slot
        if (lecturesBooked < requiredLectures) {
          for (const day of days) {
            if (lecturesBooked >= requiredLectures) break;
            const daySlots = slotsByDay[day] ?? [];
            for (const slot of daySlots) {
              if (lecturesBooked >= requiredLectures) break;
              const roomName = roomNames.find((r) =>
                isAvailable(day, slot.slotNumber, facultyName, r, tempBookings),
              );
              if (!roomName) continue;

              tempBookings.push({ day, slotNumber: slot.slotNumber, faculty: facultyName, room: roomName });
              tempEntries.push({
                day,
                slotNumber: slot.slotNumber,
                startTime: slot.startTime,
                endTime: slot.endTime,
                subject: subjectName,
                type: "lecture",
                faculty: facultyName,
                room: roomName,
              });
              lecturesBooked++;
            }
          }
        }

        // Labs: each lab occupies 2 consecutive slots
        for (let l = 0; l < requiredLabs; l++) {
          let labPlaced = false;
          const labDays = shuffle(days);

          for (const day of labDays) {
            if (labPlaced) break;
            const daySlots = [...(slotsByDay[day] ?? [])].sort((a, b) => a.slotNumber - b.slotNumber);

            for (let i = 0; i < daySlots.length - 1; i++) {
              const s1 = daySlots[i];
              const s2 = daySlots[i + 1];
              if (!s1 || !s2 || s2.slotNumber !== s1.slotNumber + 1) continue;

              const labName = labNames.find(
                (lab) =>
                  isAvailable(day, s1.slotNumber, facultyName, lab, tempBookings) &&
                  isAvailable(day, s2.slotNumber, facultyName, lab, tempBookings),
              );

              if (!labName) continue;

              tempBookings.push({ day, slotNumber: s1.slotNumber, faculty: facultyName, room: labName });
              tempBookings.push({ day, slotNumber: s2.slotNumber, faculty: facultyName, room: labName });

              // Store both slots so frontend grid fills both cells
              tempEntries.push({
                day,
                slotNumber: s1.slotNumber,
                startTime: s1.startTime,
                endTime: s1.endTime,
                subject: subjectName,
                type: "lab",
                faculty: facultyName,
                room: labName,
              });
              tempEntries.push({
                day,
                slotNumber: s2.slotNumber,
                startTime: s2.startTime,
                endTime: s2.endTime,
                subject: subjectName,
                type: "lab",
                faculty: facultyName,
                room: labName,
              });

              labsBooked++;
              labPlaced = true;
              break;
            }
          }

          if (!labPlaced) break;
        }

        if (lecturesBooked === requiredLectures && labsBooked === requiredLabs) {
          for (const b of tempBookings) {
            bookGlobal(b.day, b.slotNumber, b.faculty, b.room);
          }
          entries.push(...tempEntries);
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        console.warn(
          `⚠️ Could not fully schedule: ${subjectName} (Sem ${sem})`,
        );
      }
    }

    const timetable = await Timetable.findOneAndUpdate(
      { semester: sem },
      {
        $set: {
          semester: sem,
          entries, // ✅ IMPORTANT: write to entries, not schedule
          generatedAt: new Date(),
        },
        $unset: { schedule: 1 }, // cleanup old wrong field if present
      },
      { upsert: true, new: true },
    );

    results.push(timetable);
  }

  return results;
}
