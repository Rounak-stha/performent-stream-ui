# High-Frequency Real-Time Data Stream Demo

A high-fidelity frontend demo that simulates a **high-throughput, bursty real-time data stream** and demonstrates how to keep the UI smooth using **backpressure, buffering, coalescing, and windowing**.

This project is intentionally built as a **systems-style frontend** example: handling thousands of updates per minute while maintaining predictable rendering and clean UX.

---

## Goals

-   Simulate a **high-frequency data source** (thousands of updates/min)
-   Demonstrate **industry-grade flow control patterns** on the frontend
-   Keep rendering **smooth and stable under extreme load**
-   Clearly visualize how data moves through the system

---

## Core Concepts Demonstrated

### 1. Data Simulation (Web Worker)

-   A Web Worker acts as a high-throughput API.
-   Emits random updates (e.g. stock symbol, price, volume, timestamp).
-   Supports **configurable bursty traffic** via adjustable emit rates.
-   Keeps the main thread free from heavy computation.

---

### 2. Backpressure (Adaptive Throttling)

-   Incoming updates are queued instead of processed immediately.
-   If the queue exceeds a threshold:
    -   Consumption rate is slowed automatically.
-   Prevents the UI from rendering more updates than it can handle.
-   Demonstrates **feedback-driven flow control**.

---

### 3. Buffering (Batch Processing)

-   Updates are collected over short intervals (e.g. 50–100ms).
-   Batches are flushed using `requestAnimationFrame`.
-   Reduces render frequency and layout thrashing.
-   Designed to work seamlessly with coalescing.

---

### 4. Coalescing (Latest-Only Updates)

-   Multiple updates for the same item in a buffer window are merged.
-   Only the **latest value per item** is applied.
-   Implemented using a `Map` keyed by item ID.
-   Ensures high update rates don’t overwhelm the UI.

---

### 5. Windowing (Virtualized Rendering)

-   Supports thousands of rows without rendering them all.
-   Only visible rows are mounted in the DOM.
-   Enables smooth scrolling and consistent frame rates.
-   Virtual window size is configurable.

---

## UI / UX Features

-   Subtle animations to visualize live updates
-   Optional row highlight animations to showcase coalescing
-   Real-time dashboard displaying:
    -   Total updates received
    -   Updates rendered
    -   Current buffer size
    -   Throttling state
    -   `requestAnimationFrame` for render batching
    -   Virtualized list (custom or library-based)

---

## Configurable Parameters

-   Update rate (events per second)
-   Buffer interval (ms)
-   Virtual window size
-   Throttling threshold
-   Extreme load toggle (2× / 3× traffic)

All parameters are adjustable at runtime to observe system behavior.

---

## Why This Matters

Real-world applications (trading dashboards, analytics tools, monitoring UIs) rarely fail due to lack of features — they fail due to **uncontrolled data flow**.

This demo shows how frontend systems can:

-   Apply **backpressure**
-   Control rendering costs
-   Stay responsive under stress
-   Scale gracefully without hacks

---
