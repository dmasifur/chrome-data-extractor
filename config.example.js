// Copy this file to `config.js` and point it at your own site.
// `config.js` is gitignored, so your real selectors stay local.

const GRID_ROW = "#records-grid tbody tr:nth-of-type(2)";

const CONFIG = {
  columns: [
    "Id",
    "Title",
    "FirstName",
    "LastName",
    "DOB",
    "Email",
    "CourseName",
    "StartDate",
    "EndDate",
  ],

  autoCopyWhenComplete: true,

  pages: [
    {
      name: "Page 1 - record home",
      match: /\/records\/detail/i,
      fields: {
        Id: { selector: `${GRID_ROW} td:nth-child(1)` },
        Title: { selector: `${GRID_ROW} td:nth-child(2)` },
        FirstName: { selector: `${GRID_ROW} td:nth-child(3)` },
        LastName: { selector: `${GRID_ROW} td:nth-child(4)` },
        DOB: { selector: `${GRID_ROW} td:nth-child(8)` },
        Email: { selector: `${GRID_ROW} td:nth-child(11)` },
      },
    },
    {
      name: "Page 2 - enrolment",
      match: /\/records\/enrolment/i,
      fields: {
        CourseName: {
          selector: "#field-course",
          label: "Course",
          transform: "courseName",
        },
        StartDate: {
          selector: "#field-start-date",
          label: "Start Date",
          transform: "longDate",
        },
        EndDate: {
          selector: "#field-finish-date",
          label: "Finish Date",
          transform: "longDate",
        },
      },
      // Read but never written to a column: guards against merging two
      // different records into one row.
      verify: {
        Id: { selector: "#label-record-id", label: "Record ID" },
      },
    },
  ],
};
