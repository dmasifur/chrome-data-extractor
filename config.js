const GRID_ROW = "#ctl00_Main_GridView1 tbody tr:nth-of-type(2)";

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
    {
      name: "Page 1 - std home",
      match: /\/SSPages\/SS_StdHome/i,
      fields: {
        Id: { selector: `${GRID_ROW} td:nth-child(1)` },
        Title: { selector: `${GRID_ROW} td:nth-child(2)` },
        FirstName: { selector: `${GRID_ROW} td:nth-child(3)` },
        LastName: { selector: `${GRID_ROW} td:nth-child(4)` },
        DOB: { selector: `${GRID_ROW} td:nth-child(8)` },
        CollegeEmail: { selector: `${GRID_ROW} td:nth-child(11)` },
      },
    },
    {
      name: "Page 2 - st enrol",
      match: /\/SSPages\/SS_StdEnroll/i,
      fields: {
        CourseName: {
          selector: "#ctl00_Main_1stCourse",
          label: "Course",
          transform: "courseName",
        },
        StartDate: {
          selector: "#ctl00_Main_lblStartDate",
          label: "Start Date",
          transform: "longDate",
        },
        EndDate: {
          selector: "#ctl00_Main_lblFinishDate",
          label: "Finish Date",
          transform: "longDate",
        },
      },
      // Read but never written to a column: guards against merging two
      // different students into one row.
      verify: {
        Id: { selector: "#ctl00_Main_lblStudentID", label: "Student ID" },
      },
    },
  ],
};
