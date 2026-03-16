import Faculty from "../models/faculty";
import Room from "../models/room";
import Lab from "../models/lab";
import Subject from "../models/subject";
import TimeSlot from "../models/timeslot";
import Timetable from "../models/timetable";

interface SlotEntry {
  day: string;
  slotNumber: number;
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
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// 2 was too restrictive for real datasets, especially with labs taking 2 slots
const MAX_PER_DAY = 4;

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

const toPositiveInt = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
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
      if (!day || !Number.isFinite(slotNumber)) return null;
      return { day, slotNumber };
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

  const availableDays = Object.keys(slotsByDay).sort((a, b) => dayOrder(a) - dayOrder(b));

  const facultyNames = faculties
    .map((f: any) => pickText(f.shortName, f.name, f.code))
    .filter(Boolean);

  const roomNames = rooms
    .map((r: any) => pickText(r.name, r.roomName))
    .filter(Boolean);

  const labNames = labs
    .map((l: any) => pickText(l.name, l.labName))
    .filter(Boolean);

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

  const isFacultyFree = (day: string, slotNum: number, facultyName: string) => {
    return !occupiedFaculty[slotKey(day, slotNum)]?.has(facultyName);
  };

  const isRoomFree = (day: string, slotNum: number, roomName: string) => {
    return !occupiedRoom[slotKey(day, slotNum)]?.has(roomName);
  };

  const canUseFacultyOnDay = (day: string, facultyName: string, extraSlots: number) => {
    const currentDayLoad = facultyLoad[facultyName]?.perDay[day] ?? 0;
    return currentDayLoad + extraSlots <= MAX_PER_DAY;
  };

  const book = (day: string, slotNum: number, facultyName: string, roomName: string) => {
    const key = slotKey(day, slotNum);

    if (!occupiedFaculty[key]) occupiedFaculty[key] = new Set();
    if (!occupiedRoom[key]) occupiedRoom[key] = new Set();

    occupiedFaculty[key].add(facultyName);
    occupiedRoom[key].add(roomName);

    facultyLoad[facultyName].total += 1;
    facultyLoad[facultyName].perDay[day] += 1;
  };

  const semesters = [
    ...new Set(
      subjects
        .map((s: any) => normalizeSemester(s.semester))
        .filter((n: number) => Number.isFinite(n))
    ),
  ].sort((a, b) => a - b);

  if (!semesters.length) {
    throw new Error("No valid semester values found in subjects.");
  }

  const results: any[] = [];

  for (const sem of semesters) {
    const semSubjects = subjects
      .filter((s: any) => normalizeSemester(s.semester) === sem)
      .sort((a: any, b: any) => {
        const aWeight = toPositiveInt(a.lecturesPerWeek, 3) + (a.hasLab ? 2 : 0);
        const bWeight = toPositiveInt(b.lecturesPerWeek, 3) + (b.hasLab ? 2 : 0);
        return bWeight - aWeight;
      });

    const entries: SlotEntry[] = [];

    for (const subj of semSubjects) {
      const subjectName = pickText(subj.name, subj.code, "Unknown");
      const requiredLectures = toPositiveInt(subj.lecturesPerWeek, 3);
      const requiredLabs =
        subj.hasLab && labNames.length > 0 ? toPositiveInt(subj.labsPerWeek, 1) : 0;

      let bestPlan: {
        facultyName: string;
        entries: SlotEntry[];
        score: number;
      } | null = null;

      const sortedFaculty = [...facultyNames].sort(
        (a, b) => (facultyLoad[a]?.total ?? 0) - (facultyLoad[b]?.total ?? 0)
      );

      for (const facultyName of sortedFaculty) {
        const plannedEntries: SlotEntry[] = [];
        const localBooked = new Set<string>();

        const locallyFacultyFree = (day: string, slotNum: number) =>
          isFacultyFree(day, slotNum, facultyName) && !localBooked.has(`F:${day}:${slotNum}`);

        const locallyRoomFree = (day: string, slotNum: number, roomName: string) =>
          isRoomFree(day, slotNum, roomName) && !localBooked.has(`R:${roomName}:${day}:${slotNum}`);

        const localDayLoad = (day: string) =>
          plannedEntries.filter((e) => e.faculty === facultyName && e.day === day).length;

        const canUseDay = (day: string, extraSlots: number) =>
          canUseFacultyOnDay(day, facultyName, localDayLoad(day) + extraSlots);

        let lecturesBooked = 0;
        let labsBooked = 0;

        const lectureDays = shuffle(availableDays);

        // Pass 1: spread lectures
        for (const day of lectureDays) {
          if (lecturesBooked >= requiredLectures) break;
          if (!canUseDay(day, 1)) continue;

          const daySlots = slotsByDay[day] ?? [];
          for (const slot of daySlots) {
            if (!locallyFacultyFree(day, slot.slotNumber)) continue;

            const roomName = roomNames.find((room) =>
              locallyRoomFree(day, slot.slotNumber, room)
            );

            if (!roomName) continue;

            plannedEntries.push({
              day,
              slotNumber: slot.slotNumber,
              subject: subjectName,
              type: "lecture",
              faculty: facultyName,
              room: roomName,
            });

            localBooked.add(`F:${day}:${slot.slotNumber}`);
            localBooked.add(`R:${roomName}:${day}:${slot.slotNumber}`);
            lecturesBooked++;
            break;
          }
        }

        // Pass 2: fill remaining lectures
        if (lecturesBooked < requiredLectures) {
          for (const day of lectureDays) {
            if (lecturesBooked >= requiredLectures) break;
            if (!canUseDay(day, 1)) continue;

            const daySlots = slotsByDay[day] ?? [];
            for (const slot of daySlots) {
              if (lecturesBooked >= requiredLectures) break;
              if (!locallyFacultyFree(day, slot.slotNumber)) continue;

              const roomName = roomNames.find((room) =>
                locallyRoomFree(day, slot.slotNumber, room)
              );

              if (!roomName) continue;

              plannedEntries.push({
                day,
                slotNumber: slot.slotNumber,
                subject: subjectName,
                type: "lecture",
                faculty: facultyName,
                room: roomName,
              });

              localBooked.add(`F:${day}:${slot.slotNumber}`);
              localBooked.add(`R:${roomName}:${day}:${slot.slotNumber}`);
              lecturesBooked++;
            }
          }
        }

        // Labs are attempted, but failure no longer deletes all lectures
        if (requiredLabs > 0) {
          const labDays = shuffle(availableDays);

          for (let l = 0; l < requiredLabs; l++) {
            let placed = false;

            for (const day of labDays) {
              if (placed) break;
              if (!canUseDay(day, 2)) continue;

              const daySlots = [...(slotsByDay[day] ?? [])].sort(
                (a, b) => a.slotNumber - b.slotNumber
              );

              for (let i = 0; i < daySlots.length - 1; i++) {
                const s1 = daySlots[i];
                const s2 = daySlots[i + 1];

                if (!s1 || !s2) continue;
                if (s2.slotNumber !== s1.slotNumber + 1) continue;
                if (!locallyFacultyFree(day, s1.slotNumber)) continue;
                if (!locallyFacultyFree(day, s2.slotNumber)) continue;

                const labName = labNames.find(
                  (lab) =>
                    locallyRoomFree(day, s1.slotNumber, lab) &&
                    locallyRoomFree(day, s2.slotNumber, lab)
                );

                if (!labName) continue;

                plannedEntries.push({
                  day,
                  slotNumber: s1.slotNumber,
                  subject: subjectName,
                  type: "lab",
                  faculty: facultyName,
                  room: labName,
                });

                plannedEntries.push({
                  day,
                  slotNumber: s2.slotNumber,
                  subject: subjectName,
                  type: "lab",
                  faculty: facultyName,
                  room: labName,
                });

                localBooked.add(`F:${day}:${s1.slotNumber}`);
                localBooked.add(`F:${day}:${s2.slotNumber}`);
                localBooked.add(`R:${labName}:${day}:${s1.slotNumber}`);
                localBooked.add(`R:${labName}:${day}:${s2.slotNumber}`);

                labsBooked++;
                placed = true;
                break;
              }
            }
          }
        }

        const score = plannedEntries.length;

        if (!bestPlan || score > bestPlan.score) {
          bestPlan = { facultyName, entries: plannedEntries, score };
        }

        // full requirement satisfied, stop early
        const fullTarget = requiredLectures + requiredLabs * 2;
        if (score >= fullTarget) break;
      }

      if (!bestPlan || bestPlan.entries.length === 0) {
        console.warn(`⚠️ Could not schedule any slot for ${subjectName} (Sem ${sem})`);
        continue;
      }

      // Commit best plan to global occupancy
      for (const entry of bestPlan.entries) {
        book(entry.day, entry.slotNumber, entry.faculty, entry.room);
        entries.push(entry);
      }

      const lectureCount = bestPlan.entries.filter((e) => e.type === "lecture").length;
      const labCount = bestPlan.entries.filter((e) => e.type === "lab").length / 2;

      if (lectureCount < requiredLectures || labCount < requiredLabs) {
        console.warn(
          `⚠️ Partial schedule for ${subjectName} (Sem ${sem}) - lectures: ${lectureCount}/${requiredLectures}, labs: ${labCount}/${requiredLabs}`
        );
      }
    }

    entries.sort(
      (a, b) => dayOrder(a.day) - dayOrder(b.day) || a.slotNumber - b.slotNumber
    );

    const timetable = await Timetable.findOneAndUpdate(
      { semester: sem },
      {
        $set: {
          semester: sem,
          entries,
          generatedAt: new Date(),
        },
        $unset: { schedule: 1 },
      },
      { upsert: true, new: true }
    );

    results.push(timetable);
  }

  return results;
}
