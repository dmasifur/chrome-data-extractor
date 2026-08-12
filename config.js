const CONFIG = {
  columns: [
    "Id",
    "Title",
    "FirstName",
    "LastName",
    "DOB",
    "CollegeEmail",
    "CourseName",
    "StartDate",
    "EndDate",
  ],

  autoCopyWhenComplete: true,

  pages: [
    // TODO: Adjust selector
    {
      name: "Page 1 - std home",
      match: /\/SSPages\/SS_StdHome/i,
      fields: {
        Id: { selector: "" },
        Title: { selector: "" },
        FirstName: { selector: "" },
        LastName: { selector: "" },
        DOB: { selector: "" },
        CollegeEmail: { selector: "" },
      },
    },
    {
      name: "Page 2 - st enrol",
      match: /\/SSPages\/SS_StdEnroll/i,
      fields: {
        CourseName: { selector: "" },
        StartDate: { selector: "" },
        EndDate: { selector: "" },
      },
    },
  ],
};
