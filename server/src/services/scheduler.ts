import Faculty from "../models/faculty.js";
import Room from "../models/room.js";
import Lab from "../models/lab.js";
import Subject from "../models/subject.js";
import TimeSlot from "../models/timeslot.js";
import Timetable from "../models/timetable.js";

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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MAX_PER_DAY = 2; // max lectures per faculty per day

export async function generateTimetable() {
  // 1. Fetch all data
  const [faculties, rooms, labs, subjects, timeSlots] = await Promise.all([
    Faculty.find().lean(),
    Room.find().lean(),
    Lab.find().lean(),
    Subject.find().lean(),
    TimeSlot.find().sort({ day: 1, slotNumber: 1 }).lean(),
  ]);

  if (!faculties.length || !rooms.length || !subjects.length || !timeSlots.length) {
    throw new Error("Missing data: ensure faculty, rooms, subjects, and time slots are populated.");
  }

  // 2. Build slot map per day
  const slotsByDay: { [day: string]: typeof timeSlots } = {};
  for (const slot of timeSlots) {
    if (!slot.day) continue;
    if (!slotsByDay[slot.day]) slotsByDay[slot.day] = [];
    slotsByDay[slot.day]!.push(slot);
  }

  // 3. Global trackers (shared across all 3 semesters)
  const facultyLoad: FacultyLoad = {};
  for (const f of faculties) {
    facultyLoad[f.name] = { total: 0, perDay: {} };
    for (const d of DAYS) facultyLoad[f.name]!.perDay[d] = 0;
  }

  // occupied[day][slotNumber] = Set of faculty/room names already booked
  const occupiedFaculty: { [key: string]: Set<string> } = {};
  const occupiedRoom: { [key: string]: Set<string> } = {};

  const slotKey = (day: string, slotNum: number) => `${day}-${slotNum}`;

  const isAvailable = (day: string, slotNum: number, facultyName: string, roomName: string) => {
    const key = slotKey(day, slotNum);
    if (occupiedFaculty[key]?.has(facultyName)) return false;
    if (occupiedRoom[key]?.has(roomName)) return false;
    if ((facultyLoad[facultyName]?.perDay[day] || 0) >= MAX_PER_DAY) return false;
    return true;
  };

  const book = (day: string, slotNum: number, facultyName: string, roomName: string) => {
    const key = slotKey(day, slotNum);
    if (!occupiedFaculty[key]) occupiedFaculty[key] = new Set();
    if (!occupiedRoom[key]) occupiedRoom[key] = new Set();
    occupiedFaculty[key].add(facultyName);
    occupiedRoom[key].add(roomName);
    if (facultyLoad[facultyName]) {
      facultyLoad[facultyName].total++;
      facultyLoad[facultyName].perDay[day]!++;
    }
  };

  // 4. Generate for each semester
  const semesters = [1, 2, 3];
  const results: any[] = [];

  for (const sem of semesters) {
    const semSubjects = subjects.filter((s) => s.semester === sem);
    if (!semSubjects.length) continue;

    const schedule: SlotEntry[] = [];

    // Each subject needs 3 lectures + 1 lab per week
    for (const subj of semSubjects) {
      // Pick faculty with least load
      const sortedFaculty = [...faculties].sort(
        (a, b) => (facultyLoad[a.name]?.total || 0) - (facultyLoad[b.name]?.total || 0)
      );

      let assigned = false;

      for (const faculty of sortedFaculty) {
        let lecturesBooked = 0;
        let labBooked = false;

        // Spread lectures across different days
        const shuffledDays = [...DAYS].sort(() => Math.random() - 0.5);

        // Book 3 lectures
        for (const day of shuffledDays) {
          if (lecturesBooked >= 3) break;
          const daySlots = slotsByDay[day] || [];

          for (const slot of daySlots) {
            if (lecturesBooked >= 3) break;
            // Pick a random available room
            const availableRoom = rooms.find((r) =>
              isAvailable(day, slot.slotNumber, faculty.name, r.name)
            );
            if (!availableRoom) continue;

            book(day, slot.slotNumber, faculty.name, availableRoom.name);
            schedule.push({
              day,
              slotNumber: slot.slotNumber,
              startTime: slot.startTime,
              endTime: slot.endTime,
              subject: subj.name,
              type: "lecture",
              faculty: faculty.name,
              room: availableRoom.name,
            });
            lecturesBooked++;
            break; // one lecture per day for this subject
          }
        }

        // Book 1 lab (2-slot block)
        if (lecturesBooked === 3 && labs.length > 0) {
          for (const day of shuffledDays) {
            if (labBooked) break;
            const daySlots = (slotsByDay[day] || []).sort((a, b) => a.slotNumber - b.slotNumber);

            for (let i = 0; i < daySlots.length - 1; i++) {
              const s1 = daySlots[i];
              const s2 = daySlots[i + 1];
              if (!s1 || !s2 || s2.slotNumber !== s1.slotNumber + 1) continue;

              const availableLab = labs.find(
                (l) =>
                  isAvailable(day, s1.slotNumber, faculty.name, l.name) &&
                  isAvailable(day, s2.slotNumber, faculty.name, l.name)
              );
              if (!availableLab) continue;

              book(day, s1.slotNumber, faculty.name, availableLab.name);
              book(day, s2.slotNumber, faculty.name, availableLab.name);

              schedule.push({
                day, slotNumber: s1.slotNumber, startTime: s1.startTime, endTime: s2.endTime,
                subject: subj.name, type: "lab", faculty: faculty.name, room: availableLab.name,
              });
              labBooked = true;
              break;
            }
          }
        }

        if (lecturesBooked === 3) {
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        console.warn(`⚠️ Could not fully schedule: ${subj.name} (Sem ${sem})`);
      }
    }

    // 5. Save to DB
    const timetable = await Timetable.findOneAndUpdate(
      { semester: sem },
      { semester: sem, schedule, generatedAt: new Date() },
      { upsert: true, new: true }
    );
    results.push(timetable);
  }

  return results;
}
