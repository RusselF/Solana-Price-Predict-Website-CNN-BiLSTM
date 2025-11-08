import React from "react";
import Sidebar from "./Sidebar";

function DashboardLayout({ role, children }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar role={role} />
      <div style={{ marginLeft: "200px", padding: "20px", width: "100%" }}>
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;
