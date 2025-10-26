"use client";
import React from "react";

export default function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card h-full rounded-xl border bg-white shadow-sm flex flex-col overflow-hidden">
      <div className="card-header flex items-center justify-between px-3 py-2 border-b bg-gray-50">
        <h2 className="font-semibold text-base">{title}</h2>
        {right ? <div className="text-sm text-gray-600">{right}</div> : null}
      </div>
      <div className="card-body flex-1 min-h-0 p-2">{children}</div>
    </div>
  );
}
