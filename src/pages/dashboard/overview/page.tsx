"use client";

import React, { useEffect, useState } from "react";
import { KpiCard } from "@/components/kpi/KpiCard";
import { kpiData } from "@/data/kpi";
import { fmt } from "@/lib/utils";

const DashboardOverview: React.FC = () => {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "custom">("30d");
  const [revenueData, setRevenueData] = useState<Array<{ amount: number; orders: number; aov: number }>>([]);

  useEffect(() => {
    const fetchData = () => {
      const data = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const baseAmount = 2000 + Math.random() * 1000;
        const baseOrders = 50 + Math.random() * 30;
        const baseAov = 40 + Math.random() * 15;
        data.push({
          amount: Math.round(baseAmount),
          orders: Math.round(baseOrders),
          aov: Math.round(baseAov * 10) / 10,
        });
      }
      setRevenueData(data);
    };
    fetchData();
  }, [range]);

  const kpis = [
    { ...kpiData.totalOrders, value: kpiData.totalOrders.value },
    { ...kpiData.monthOrders, value: kpiData.monthOrders.value },
    { ...kpiData.totalRevenue, value: kpiData.totalRevenue.value },
    { ...kpiData.aov, value: kpiData.aov.value },
    { ...kpiData.totalProducts, value: kpiData.totalProducts.value },
    { ...kpiData.publishedProducts, value: kpiData.publishedProducts.value },
  ];

  return (
    <div style={{ padding: "1rem", background: "#FAF7F0", minHeight: "100vh" }}>
      <h1 style={{ color: "#16231F", fontFamily: "'Fraunces', serif", fontSize: "2rem", fontWeight: 900, marginBottom: "1rem" }}>
        EcommerceHubator Admin Dashboard
      </h1>

      <p style={{ color: "#4A554F", marginBottom: "2rem" }}>
        Welcome to your admin dashboard.
      </p>

      <div style={{ padding: "1rem", background: "#F1ECDF", borderRadius: "8px", marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.id}
              currency={kpi.currency || "INR"}
              value={kpi.value}
              label={kpi.title}
              percentage={kpi.trend?.percentage}
              trendDirection={kpi.trend?.direction}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          onClick={() => setRange("7d")}
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "1px solid #C99A2E",
            borderRadius: "4px",
            color: "#C99A2E",
            fontWeight: "500",
            ...(range === "7d" && { background: "#C99A2E", color: "white" }),
          }}
        >
          7d
        </button>
        <button
          onClick={() => setRange("30d")}
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "1px solid #C99A2E",
            borderRadius: "4px",
            color: "#C99A2E",
            fontWeight: "500",
            ...(range === "30d" && { background: "#C99A2E", color: "white" }),
          }}
        >
          30d
        </button>
        <button
          onClick={() => setRange("90d")}
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "1px solid #C99A2E",
            borderRadius: "4px",
            color: "#C99A2E",
            fontWeight: "500",
            ...(range === "90d" && { background: "#C99A2E", color: "white" }),
          }}
        >
          90d
        </button>
      </div>

      <div style={{ background: "#F1ECDF", borderRadius: "8px", padding: "1rem" }}>
        <h3 style={{ color: "#16231F", fontFamily: '"Work Sans", sans-serif', fontSize: "1rem", marginBottom: "0.5rem" }}>
          Revenue Over Time
        </h3>
        <div style={{ height: "200px", background: "white", borderRadius: "4px", overflow: "hidden" }}>
          {revenueData.length > 0 && (
            <p style={{ fontSize: "0.8rem", color: "#4A554F", padding: "1rem" }}>
              Showing {revenueData.length} days of revenue data<br/>
              Total displayed: {fmt(revenueData.reduce((sum, p) => sum + p.amount, 0), "INR")}
            </p>
          )}
          {revenueData.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: "#4A554F", padding: "1rem" }}>
              No data for selected range
            </p>
          )}
        </div>
      </div>

      <nav style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <a
            href="/dashboard/orders"
            style={{
              color: "#C99A2E",
              fontWeight: "500",
              textDecoration: "none",
              padding: "0.5rem 1rem",
              border: "1px solid #D8D2C4",
              borderRadius: "4px",
            }}
          >
            Orders
          </a>
          <a
            href="/dashboard/products"
            style={{
              color: "#C99A2E",
              fontWeight: "500",
              textDecoration: "none",
              padding: "0.5rem 1rem",
              border: "1px solid #D8D2C4",
              borderRadius: "4px",
            }}
          >
            Products
          </a>
          <a
            href="/dashboard/settings"
            style={{
              color: "#C99A2E",
              fontWeight: "500",
              textDecoration: "none",
              padding: "0.5rem 1rem",
              border: "1px solid #D8D2C4",
              borderRadius: "4px",
            }}
          >
            Settings
          </a>
        </div>
      </nav>
    </div>
  );
};

export default DashboardOverview;