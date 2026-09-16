import mongoose from "mongoose";
import dotenv from "dotenv";
import Batch from "../models/batch.model.js";
import Discipline from "../models/discipline.model.js";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not found in environment variables.");
  process.exit(1);
}

async function migrateSyllabus() {
  try {
    console.log("Connecting to MongoDB for syllabus migration...");
    await mongoose.connect(uri);
    console.log(`Connected to database: ${mongoose.connection.name}`);

    const batches = await Batch.find({ isActive: true }).populate("disciplineId");
    console.log(`Found ${batches.length} active batch(es) to check.`);

    let updatedCount = 0;

    for (const batch of batches) {
      if (!batch.disciplineId || !batch.disciplineId.syllabus) {
        console.log(`Batch ${batch.name}: No discipline or syllabus found. Skipping.`);
        continue;
      }

      const semSyllabus = batch.disciplineId.syllabus.find(
        (s) => s.semester === batch.currentSemester
      );

      if (!semSyllabus || !semSyllabus.subjects || semSyllabus.subjects.length === 0) {
        console.log(`Batch ${batch.name} (Sem ${batch.currentSemester}): No syllabus entry. Skipping.`);
        continue;
      }

      // Check if semesterSubjects already has an entry for current semester
      const existing = (batch.semesterSubjects || []).find(
        (s) => s.semester === batch.currentSemester
      );

      if (!existing || !existing.subjects || existing.subjects.length === 0) {
        const subjectIds = semSyllabus.subjects.map((s) => (s._id ? s._id : s));
        batch.semesterSubjects = [
          ...(batch.semesterSubjects || []).filter((s) => s.semester !== batch.currentSemester),
          { semester: batch.currentSemester, subjects: subjectIds },
        ];

        await batch.save();
        updatedCount++;
        console.log(`Batch ${batch.name} (Sem ${batch.currentSemester}): Migrated ${subjectIds.length} subjects to semesterSubjects.`);
      } else {
        console.log(`Batch ${batch.name} (Sem ${batch.currentSemester}): Already has ${existing.subjects.length} subjects assigned. Skipping.`);
      }
    }

    console.log(`\nMigration completed! Successfully updated ${updatedCount} batch(es).`);
  } catch (err) {
    console.error("Migration failed with error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

migrateSyllabus();
