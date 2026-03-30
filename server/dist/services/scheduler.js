"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTimetable = generateTimetable;
const faculty_1 = __importDefault(require("../models/faculty"));
const room_1 = __importDefault(require("../models/room"));
const subject_1 = __importDefault(require("../models/subject"));
const timeslot_1 = __importDefault(require("../models/timeslot"));
const timetable_1 = __importDefault(require("../models/timetable"));
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MAX_PER_DAY = 4;
const DAY_MAP = {
    mon: "Monday", monday: "Monday",
    tue: "Tuesday", tues: "Tuesday", tuesday: "Tuesday",
    wed: "Wednesday", weds: "Wednesday", wednesday: "Wednesday",
    thu: "Thursday", thur: "Thursday", thurs: "Thursday", thursday: "Thursday",
    fri: "Friday", friday: "Friday",
    sat: "Saturday", saturday: "Saturday",
};
const normalizeDay = (value) => {
    if (!value)
        return "";
    const raw = String(value).trim();
    return DAY_MAP[raw.toLowerCase()] || raw;
};
const normalizeSemester = (value) => {
    const n = Number(value);
    if (Number.isFinite(n))
        return n;
    const match = String(value !== null && value !== void 0 ? value : "").match(/\d+/);
    return match ? Number(match[0]) : NaN;
};
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
function generateTimetable() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const [faculties, rooms, subjects, rawTimeSlots] = yield Promise.all([
            faculty_1.default.find().lean(),
            room_1.default.find().lean(),
            subject_1.default.find().lean(),
            timeslot_1.default.find().lean(),
        ]);
        console.log(`📊 Data: ${faculties.length} faculty, ${rooms.length} rooms, ${subjects.length} subjects, ${rawTimeSlots.length} slots`);
        if (!faculties.length || !rooms.length || !subjects.length || !rawTimeSlots.length) {
            throw new Error("Missing data: ensure faculty, rooms, subjects, and time slots are populated.");
        }
        const lectureRooms = rooms.filter((r) => r.type === "lecture").map((r) => r.name).filter(Boolean);
        const labRooms = rooms.filter((r) => r.type === "lab").map((r) => r.name).filter(Boolean);
        console.log(`🏫 Lecture rooms: [${lectureRooms.join(", ")}]`);
        console.log(`🔬 Lab rooms: [${labRooms.join(", ")}]`);
        if (!lectureRooms.length)
            throw new Error("No lecture-type rooms found. Add rooms with type='lecture'.");
        const timeSlots = rawTimeSlots
            .map((slot) => {
            var _a;
            const day = normalizeDay(slot.day);
            const slotNumber = Number((_a = slot.slotNumber) !== null && _a !== void 0 ? _a : slot.period);
            const startTime = slot.startTime || slot.start || "";
            const endTime = slot.endTime || slot.end || "";
            if (!day || !Number.isFinite(slotNumber))
                return null;
            return { day, slotNumber, startTime, endTime };
        })
            .filter(Boolean);
        if (!timeSlots.length)
            throw new Error("No valid time slots found.");
        const dayOrder = (day) => {
            const idx = DAYS.indexOf(day);
            return idx === -1 ? 999 : idx;
        };
        timeSlots.sort((a, b) => dayOrder(a.day) - dayOrder(b.day) || a.slotNumber - b.slotNumber);
        const slotsByDay = {};
        for (const slot of timeSlots) {
            if (!slotsByDay[slot.day])
                slotsByDay[slot.day] = [];
            slotsByDay[slot.day].push(slot);
        }
        const availableDays = Object.keys(slotsByDay);
        const facultyMap = {};
        for (const f of faculties) {
            const key = f.shortName || f.name;
            if (key)
                facultyMap[key] = { name: f.name, subjects: f.subjects || [] };
        }
        const allFacultyNames = Object.keys(facultyMap);
        if (!allFacultyNames.length)
            throw new Error("No valid faculty found.");
        const facultyLoad = {};
        for (const fac of allFacultyNames) {
            facultyLoad[fac] = { total: 0, perDay: {} };
            for (const d of [...new Set([...DAYS, ...availableDays])]) {
                facultyLoad[fac].perDay[d] = 0;
            }
        }
        // Global occupancy tracking
        const occupiedFaculty = {};
        const occupiedRoom = {};
        const occupiedSemesterSlot = {}; // NEW: prevent same-semester conflicts
        const slotKey = (day, slotNum) => `${day}-${slotNum}`;
        const tempDayLoad = (temp, faculty, day) => temp.filter((b) => b.faculty === faculty && b.day === day).length;
        const isAvailable = (day, slotNum, facultyName, roomName, tempBookings, semester // NEW param
        ) => {
            var _a, _b, _c, _d, _e;
            const key = slotKey(day, slotNum);
            // Check semester-slot conflict: another subject in the same semester already occupies this slot
            if ((_a = occupiedSemesterSlot[key]) === null || _a === void 0 ? void 0 : _a.has(String(semester)))
                return false;
            if ((_b = occupiedFaculty[key]) === null || _b === void 0 ? void 0 : _b.has(facultyName))
                return false;
            if ((_c = occupiedRoom[key]) === null || _c === void 0 ? void 0 : _c.has(roomName))
                return false;
            const tempConflict = tempBookings.some((b) => b.day === day && b.slotNumber === slotNum && (b.faculty === facultyName || b.room === roomName));
            if (tempConflict)
                return false;
            const currentDayLoad = (_e = (_d = facultyLoad[facultyName]) === null || _d === void 0 ? void 0 : _d.perDay[day]) !== null && _e !== void 0 ? _e : 0;
            if (currentDayLoad + tempDayLoad(tempBookings, facultyName, day) >= MAX_PER_DAY)
                return false;
            return true;
        };
        const bookGlobal = (day, slotNum, facultyName, roomName, semester) => {
            const key = slotKey(day, slotNum);
            if (!occupiedFaculty[key])
                occupiedFaculty[key] = new Set();
            if (!occupiedRoom[key])
                occupiedRoom[key] = new Set();
            if (!occupiedSemesterSlot[key])
                occupiedSemesterSlot[key] = new Set();
            occupiedFaculty[key].add(facultyName);
            occupiedRoom[key].add(roomName);
            occupiedSemesterSlot[key].add(String(semester)); // NEW: mark semester-slot as occupied
            facultyLoad[facultyName].total += 1;
            facultyLoad[facultyName].perDay[day] = (facultyLoad[facultyName].perDay[day] || 0) + 1;
        };
        const semesters = [...new Set(subjects.map((s) => normalizeSemester(s.semester)).filter(Number.isFinite))].sort((a, b) => a - b);
        if (!semesters.length)
            throw new Error("No valid semester values found in subjects.");
        const results = [];
        for (const sem of semesters) {
            const semSubjects = subjects.filter((s) => normalizeSemester(s.semester) === sem);
            if (!semSubjects.length)
                continue;
            semSubjects.sort((a, b) => {
                const aWeight = (a.hasLab ? 10 : 0) + (a.lecturesPerWeek || 3);
                const bWeight = (b.hasLab ? 10 : 0) + (b.lecturesPerWeek || 3);
                return bWeight - aWeight;
            });
            const entries = [];
            // Track semester-level temp bookings to prevent intra-subject conflicts within same semester
            const semesterTempSlots = new Set();
            for (const subj of semSubjects) {
                const subjectName = subj.name || subj.code || "Unknown";
                const subjectCode = subj.code || "";
                const requiredLectures = Math.max(0, Number((_a = subj.lecturesPerWeek) !== null && _a !== void 0 ? _a : 3));
                const requiredLabs = subj.hasLab ? Math.max(0, Number((_b = subj.labsPerWeek) !== null && _b !== void 0 ? _b : 1)) : 0;
                console.log(`📝 Scheduling: ${subjectName} (${subjectCode}) Sem ${sem} — ${requiredLectures} lectures, ${requiredLabs} labs`);
                let eligibleFaculty = allFacultyNames.filter((fn) => facultyMap[fn].subjects.includes(subjectCode));
                if (!eligibleFaculty.length) {
                    eligibleFaculty = [...allFacultyNames];
                }
                eligibleFaculty.sort((a, b) => { var _a, _b, _c, _d; return ((_b = (_a = facultyLoad[a]) === null || _a === void 0 ? void 0 : _a.total) !== null && _b !== void 0 ? _b : 0) - ((_d = (_c = facultyLoad[b]) === null || _c === void 0 ? void 0 : _c.total) !== null && _d !== void 0 ? _d : 0); });
                let bestPlan = null;
                let bestScore = -1;
                for (const facultyName of eligibleFaculty) {
                    const tempBookings = [];
                    const tempEntries = [];
                    let lecturesBooked = 0;
                    let labsBooked = 0;
                    const days = shuffle(availableDays);
                    // Pass 1: spread lectures across days (1 per day)
                    for (const day of days) {
                        if (lecturesBooked >= requiredLectures)
                            break;
                        const daySlots = (_c = slotsByDay[day]) !== null && _c !== void 0 ? _c : [];
                        for (const slot of daySlots) {
                            // Also check semester-level temp slots
                            if (semesterTempSlots.has(slotKey(day, slot.slotNumber)))
                                continue;
                            const roomName = lectureRooms.find((r) => isAvailable(day, slot.slotNumber, facultyName, r, tempBookings, sem));
                            if (!roomName)
                                continue;
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
                            if (lecturesBooked >= requiredLectures)
                                break;
                            for (const slot of ((_d = slotsByDay[day]) !== null && _d !== void 0 ? _d : [])) {
                                if (lecturesBooked >= requiredLectures)
                                    break;
                                if (semesterTempSlots.has(slotKey(day, slot.slotNumber)))
                                    continue;
                                const roomName = lectureRooms.find((r) => isAvailable(day, slot.slotNumber, facultyName, r, tempBookings, sem));
                                if (!roomName)
                                    continue;
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
                                if (labPlaced)
                                    break;
                                const daySlots = [...((_e = slotsByDay[day]) !== null && _e !== void 0 ? _e : [])].sort((a, b) => a.slotNumber - b.slotNumber);
                                for (let i = 0; i < daySlots.length - 1; i++) {
                                    const s1 = daySlots[i];
                                    const s2 = daySlots[i + 1];
                                    if (s2.slotNumber !== s1.slotNumber + 1)
                                        continue;
                                    // Check semester-level conflicts for both consecutive slots
                                    if (semesterTempSlots.has(slotKey(day, s1.slotNumber)))
                                        continue;
                                    if (semesterTempSlots.has(slotKey(day, s2.slotNumber)))
                                        continue;
                                    const labName = labRooms.find((lab) => isAvailable(day, s1.slotNumber, facultyName, lab, tempBookings, sem) &&
                                        isAvailable(day, s2.slotNumber, facultyName, lab, tempBookings, sem));
                                    if (!labName)
                                        continue;
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
                    if (lecturesBooked === requiredLectures && labsBooked === requiredLabs)
                        break;
                }
                // Commit the best plan found
                if (bestPlan && bestPlan.entries.length > 0) {
                    for (const b of bestPlan.bookings) {
                        bookGlobal(b.day, b.slotNumber, b.faculty, b.room, sem);
                        semesterTempSlots.add(slotKey(b.day, b.slotNumber)); // Track for next subject in same semester
                    }
                    entries.push(...bestPlan.entries);
                    console.log(`  ✅ Placed ${bestPlan.entries.length} slots for ${bestPlan.entries[0].subject}`);
                }
                else {
                    console.warn(`  ⚠️ Could not schedule: ${subj.name || subj.code} (Sem ${sem})`);
                }
            }
            console.log(`📅 Semester ${sem}: ${entries.length} total entries`);
            const timetable = yield timetable_1.default.findOneAndUpdate({ semester: sem }, {
                $set: {
                    semester: sem,
                    entries,
                    generatedAt: new Date(),
                },
                $unset: { schedule: 1 },
            }, { upsert: true, new: true });
            results.push(timetable);
        }
        return results;
    });
}
