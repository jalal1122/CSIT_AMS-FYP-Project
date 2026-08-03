export const parseAntigravityFilters = (req, res, next) => {
  try {
    if (req.body.filters && typeof req.body.filters === "string") {
      const parsedFilters = JSON.parse(req.body.filters);
      
      // Additional safety for nested stringified arrays if passed via form-data
      const parseArrayField = (field) => {
        if (parsedFilters[field] && typeof parsedFilters[field] === "string") {
          try {
            parsedFilters[field] = JSON.parse(parsedFilters[field]);
          } catch (e) {
            // Leave as string if not parseable
          }
        }
      };

      parseArrayField("subjects");
      parseArrayField("batches");
      parseArrayField("teachers");

      req.body.filters = parsedFilters;
    }
    next();
  } catch (error) {
    console.error("Antigravity filter parsing error:", error);
    // Proceed without filters or return 400. Typically best to proceed and let validator handle it, 
    // but here we just pass control.
    next();
  }
};
