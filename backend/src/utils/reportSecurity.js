export const getSecurityMatch = (user, collectionPrefix = "") => {
  const prefix = collectionPrefix ? `${collectionPrefix}.` : "";
  
  if (user.role === "admin") {
    return {};
  }
  
  if (user.role === "teacher") {
    return { [`${prefix}sections.teacherId`]: user._id };
  }
  
  if (user.role === "student") {
    // For universal pipelines querying Attendance, studentId is heavily indexed and exact.
    // There is no need for $or with sections.students because attendance documents are permanently linked to the student.
    return { studentId: user._id };
  }
  
  return { _id: null }; // Fallback to return nothing if role is unrecognized
};
