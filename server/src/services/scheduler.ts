import Faculty from "../models/faculty";
import Room from "../models/room";
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
const MAX_PER_DAY = 4;

const DAY_MAP: Record<string, string> = {
  mon: "Monday", monday: "Monday",
  tue: "Tuesday", tues: "Tuesday", tuesday: "Tuesday",
  wed: "Wednesday", weds: "Wednesday", wednesday: "Wednesday",
  thu: "Thursday", thur: "Thursday", thurs: "Thursday", thursday: "Thursday",
  fri: "Friday", friday: "Friday",
  sat: "Saturday", saturday: "Saturday",
};

const normalizeDay = (value: unknown): string => {
  if (!value) return "";
  const raw = String(value).trim();
  return DAY_MAP[raw.toLowerCase()] || raw;
};

const normalizeSemester = (value: unknown): number => {
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : NaN;
};

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export async function generateTimetable() {
  const [faculties, rooms, subjects, rawTimeSlots] = await Promise.all([
    Faculty.find().lean(),
    Room.find().lean(),
    Subject.find().lean(),
    TimeSlot.find().lean(),
  ]);

  console.log(`📊 Data: ${faculties.length} faculty, ${rooms.length} rooms, ${subjects.length} subjects, ${rawTimeSlots.length} slots`);

  if (!faculties.length || !rooms.length || !subjects.length || !rawTimeSlots.length) {
    throw new Error("Missing data: ensure faculty, rooms, subjects, and time slots are populated.");
  }

  const lectureRooms = rooms.filter((r: any) => r.type === "lecture").map((r: any) => r.name).filter(Boolean);
  const labRooms = rooms.filter((r: any) => r.type === "lab").map((r: any) => r.name).filter(Boolean);

  console.log(`🏫 Lecture rooms: [${lectureRooms.join(", ")}]`);
  console.log(`🔬 Lab rooms: [${labRooms.join(", ")}]`);

  if (!lectureRooms.length) throw new Error("No lecture-type rooms found. Add rooms with type='lecture'.");

  const timeSlots: NormalizedSlot[] = rawTimeSlots
    .map((slot: any) => {
      const day = normalizeDay(slot.day);
      const slotNumber = Number(slot.slotNumber ?? slot.period);
      const startTime = slot.startTime || slot.start || "";
      const endTime = slot.endTime || slot.end || "";
      if (!day || !Number.isFinite(slotNumber)) return null;
      return { day, slotNumber, startTime, endTime };
    })
    .filter(Boolean) as NormalizedSlot[];

  if (!timeSlots.length) throw new Error("No valid time slots found.");

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

  const facultyMap: Record<string, { name: string; subjects: string[] }> = {};
  for (const f of faculties as any[]) {
    const key = f.shortName || f.name;
    if (key) facultyMap[key] = { name: f.name, subjects: f.subjects || [] };
  }
  const allFacultyNames = Object.keys(facultyMap);

  if (!allFacultyNames.length) throw new Error("No valid faculty found.");

  const facultyLoad: FacultyLoad = {};
  for (const fac of allFacultyNames) {
    facultyLoad[fac] = { total: 0, perDay: {} };
    for (const d of [...new Set([...DAYS, ...availableDays])]) {
      facultyLoad[fac].perDay[d] = 0;
    }
  }

  // Global occupancy tracking
  const occupiedFaculty: Record<string, Set<string>> = {};
  const occupiedRoom: Record<string, Set<string>> = {};
  const occupiedSemesterSlot: Record<string, Set<string>> = {}; // NEW: prevent same-semester conflicts
  const slotKey = (day: string, slotNum: number) => `${day}-${slotNum}`;

  const tempDayLoad = (temp: TempBooking[], faculty: string, day: string) =>
    temp.filter((b) => b.faculty === faculty && b.day === day).length;

  const isAvailable = (
    day: string, slotNum: number, facultyName: string, roomName: string,
    tempBookings: TempBooking[], semester: number // NEW param
  ) => {
    const key = slotKey(day, slotNum);

    // Check semester-slot conflict: another subject in the same semester already occupies this slot
    if (occupiedSemesterSlot[key]?.has(String(semester))) return false;

    if (occupiedFaculty[key]?.has(facultyName)) return false;
    if (occupiedRoom[key]?.has(roomName)) return false;

    const tempConflict = tempBookings.some(
      (b) => b.day === day && b.slotNumber === slotNum && (b.faculty === facultyName || b.room === roomName)
    );
    if (tempConflict) return false;

    const currentDayLoad = facultyLoad[facultyName]?.perDay[day] ?? 0;
    if (currentDayLoad + tempDayLoad(tempBookings, facultyName, day) >= MAX_PER_DAY) return false;

    return true;
  };

  const bookGlobal = (day: string, slotNum: number, facultyName: string, roomName: string, semester: number) => {
    const key = slotKey(day, slotNum);
    if (!occupiedFaculty[key]) occupiedFaculty[key] = new Set();
    if (!occupiedRoom[key]) occupiedRoom[key] = new Set();
    if (!occupiedSemesterSlot[key]) occupiedSemesterSlot[key] = new Set();
    occupiedFaculty[key].add(facultyName);
    occupiedRoom[key].add(roomName);
    occupiedSemesterSlot[key].add(String(semester)); // NEW: mark semester-slot as occupied
    facultyLoad[facultyName].total += 1;
    facultyLoad[facultyName].perDay[day] = (facultyLoad[facultyName].perDay[day] || 0) + 1;
  };

  const semesters = [...new Set(
    subjects.map((s: any) => normalizeSemester(s.semester)).filter(Number.isFinite)
  )].sort((a, b) => a - b);

  if (!semesters.length) throw new Error("No valid semester values found in subjects.");

  const results: any[] = [];

  for (const sem of semesters) {
    const semSubjects = subjects.filter((s: any) => normalizeSemester(s.semester) === sem);
    if (!semSubjects.length) continue;

    semSubjects.sort((a: any, b: any) => {
      const aWeight = (a.hasLab ? 10 : 0) + (a.lecturesPerWeek || 3);
      const bWeight = (b.hasLab ? 10 : 0) + (b.lecturesPerWeek || 3);
      return bWeight - aWeight;
    });

    const entries: SlotEntry[] = [];

    // Track semester-level temp bookings to prevent intra-subject conflicts within same semester
    const semesterTempSlots: Set<string> = new Set();

    for (const subj of semSubjects as any[]) {
      const subjectName = subj.name || subj.code || "Unknown";
      const subjectCode = subj.code || "";
      const requiredLectures = Math.max(0, Number(subj.lecturesPerWeek ?? 3));
      const requiredLabs = subj.hasLab ? Math.max(0, Number(subj.labsPerWeek ?? 1)) : 0;

      console.log(`📝 Scheduling: ${subjectName} (${subjectCode}) Sem ${sem} — ${requiredLectures} lectures, ${requiredLabs} labs`);

      let eligibleFaculty = allFacultyNames.filter(
        (fn) => facultyMap[fn].subjects.includes(subjectCode)
      );
      if (!eligibleFaculty.length) {
        eligibleFaculty = [...allFacultyNames];
      }

      eligibleFaculty.sort((a, b) => (facultyLoad[a]?.total ?? 0) - (facultyLoad[b]?.total ?? 0));

      let bestPlan: { bookings: TempBooking[]; entries: SlotEntry[] } | null = null;
      let bestScore = -1;

      for (const facultyName of eligibleFaculty) {
        const tempBookings: TempBooking[] = [];
        const tempEntries: SlotEntry[] = [];
        let lecturesBooked = 0;
        let labsBooked = 0;
        const days = shuffle(availableDays);

        // Pass 1: spread lectures across days (1 per day)
        for (const day of days) {
          if (lecturesBooked >= requiredLectures) break;
          const daySlots = slotsByDay[day] ?? [];
          for (const slot of daySlots) {
            // Also check semester-level temp slots
            if (semesterTempSlots.has(slotKey(day, slot.slotNumber))) continue;

            const roomName = lectureRooms.find((r) =>
              isAvailable(day, slot.slotNumber, facultyName, r, tempBookings, sem)
            );
            if (!roomName) continue;
            tempBookings.push({ day, slotNumber: slot.slotNumber, faculty: facultyName, room: roomName });
            tempEntries.push({
              day, slotNumber: slot.slotNumber, startTime: slot.startTime, endTime: slot.endTime,
              subject: subjectName, type: "lecture", faculty: facultyName, room: roomName,
            });
            lecturesBooked++;
            break;
          }
        }

        // Pass 2: fill remaining lectures
        if (lecturesBooked < requiredLectures) {
          for (const day of days) {
            if (lecturesBooked >= requiredLectures) break;
            for (const slot of (slotsByDay[day] ?? [])) {
              if (lecturesBooked >= requiredLectures) break;
              if (semesterTempSlots.has(slotKey(day, slot.slotNumber))) continue;

              const roomName = lectureRooms.find((r) =>
                isAvailable(day, slot.slotNumber, facultyName, r, tempBookings, sem)
              );
              if (!roomName) continue;
              tempBookings.push({ day, slotNumber: slot.slotNumber, faculty: facultyName, room: roomName });
              tempEntries.push({
                day, slotNumber: slot.slotNumber, startTime: slot.startTime, endTime: slot.endTime,
                subject: subjectName, type: "lecture", faculty: facultyName, room: roomName,
              });
              lecturesBooked++;
            }
          }
        }

        // Labs: 2 consecutive slots in a lab room
        if (requiredLabs > 0 && labRooms.length > 0) {
          for (let l = 0; l < requiredLabs; l++) {
            let labPlaced = false;
            for (const day of shuffle(days)) {
              if (labPlaced) break;
              const daySlots = [...(slotsByDay[day] ?? [])].sort((a, b) => a.slotNumber - b.slotNumber);
              for (let i = 0; i < daySlots.length - 1; i++) {
                const s1 = daySlots[i];
                const s2 = daySlots[i + 1];
                if (s2.slotNumber !== s1.slotNumber + 1) continue;

                // Check semester-level conflicts for both consecutive slots
                if (semesterTempSlots.has(slotKey(day, s1.slotNumber))) continue;
                if (semesterTempSlots.has(slotKey(day, s2.slotNumber))) continue;

                const labName = labRooms.find(
                  (lab) =>
                    isAvailable(day, s1.slotNumber, facultyName, lab, tempBookings, sem) &&
                    isAvailable(day, s2.slotNumber, facultyName, lab, tempBookings, sem)
                );
                if (!labName) continue;
                tempBookings.push({ day, slotNumber: s1.slotNumber, faculty: facultyName, room: labName });
                tempBookings.push({ day, slotNumber: s2.slotNumber, faculty: facultyName, room: labName });
                tempEntries.push({
                  day, slotNumber: s1.slotNumber, startTime: s1.startTime, endTime: s1.endTime,
                  subject: subjectName, type: "lab", faculty: facultyName, room: labName,
                });
                tempEntries.push({
                  day, slotNumber: s2.slotNumber, startTime: s2.startTime, endTime: s2.endTime,
                  subject: subjectName, type: "lab", faculty: facultyName, room: labName,
                });
                labsBooked++;
                labPlaced = true;
                break;
              }
            }
          }
        }

        const score = lecturesBooked + labsBooked * 2;
        if (score > bestScore) {
          bestScore = score;
          bestPlan = { bookings: [...tempBookings], entries: [...tempEntries] };
        }

        if (lecturesBooked === requiredLectures && labsBooked === requiredLabs) break;
      }

      // Commit the best plan found
      if (bestPlan && bestPlan.entries.length > 0) {
        for (const b of bestPlan.bookings) {
          bookGlobal(b.day, b.slotNumber, b.faculty, b.room, sem);
          semesterTempSlots.add(slotKey(b.day, b.slotNumber)); // Track for next subject in same semester
        }
        entries.push(...bestPlan.entries);
        console.log(`  ✅ Placed ${bestPlan.entries.length} slots for ${bestPlan.entries[0].subject}`);
      } else {
        console.warn(`  ⚠️ Could not schedule: ${subj.name || subj.code} (Sem ${sem})`);
      }
    }

    console.log(`📅 Semester ${sem}: ${entries.length} total entries`);

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
      { upsert: true, new: true },
    );

    results.push(timetable);
  }

  return results;
}
