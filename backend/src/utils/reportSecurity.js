export const getSecurityMatch = (user, collectionPrefix = "") => {
  const prefix = collectionPrefix ? `${collectionPrefix}.` : "";
  
  if (user.role === "admin") {
    return {};
  }
  
  if (user.role === "teacher") {
    return { [`${prefix}sections.teacherId`]: user._id };
  }
  
  if (user.role === "student") {
    // For universal pipelines, if we know we are querying Attendance,
    // studentId is faster. But to be safe across Session/Allocation queries:
    return { 
      $or: [
        { studentId: user._id },
        { [`${prefix}sections.students`]: user._id }
      ]
    };
  }
  
  return { _id: null }; // Fallback to return nothing if role is unrecognized
};
