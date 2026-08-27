# Phase 9 — Fleet & Vehicle Management Module

## 1. Overview
The Fleet & Vehicle Management Module provides complete institutional transport operations tracking for school buses, vans, cars, ambulances, and maintenance vehicles.

## 2. Key Capabilities
- **Fleet Master Directory**: Uniqueness constraint on registration numbers (`409 Conflict`), capacity, fuel type, owner type.
- **Driver Assignments**: Driver vehicle assignment history (`VehicleAssignmentHistory`) with start/end dates and audit logging.
- **Daily Odometer KM Logging**: Validates `endingKm >= startingKm` and prevents starting KM lower than previous recorded ending KM. Calculates total distance on backend.
- **Fuel Receipts**: Quantity, price per unit, odometer reading, fuel station, receipt number. Backend recalculates `totalCost = quantity * pricePerUnit`.
- **Garage Maintenance Workflow**: Report issues, track estimated vs actual cost, update status (`REPORTED` -> `UNDER_INSPECTION` -> `IN_PROGRESS` -> `COMPLETED`). Restores vehicle status to `ACTIVE` upon completion.
- **Document Expiry Alerts**: Tracks insurance, fitness, permit, and registration expiries within 30 days.

## 3. Database Models
- `Vehicle`: Master record of institutional transport vehicles.
- `VehicleAssignmentHistory`: Historical record of driver-vehicle assignments.
- `VehicleKmLog`: Odometer logs per vehicle/driver/day.
- `FuelRecord`: Fuel purchase logs.
- `VehicleMaintenance`: Garage work orders.

## 4. REST APIs
- `GET /api/vehicles`: Search and filter fleet master.
- `GET /api/vehicles/:id`: Detailed vehicle profile and history.
- `POST /api/vehicles`: Register vehicle (Admin).
- `POST /api/vehicles/:id/assignments`: Assign driver to vehicle.
- `POST /api/vehicles/km-logs`: Submit daily KM log (Driver).
- `POST /api/vehicles/fuel`: Submit fuel log (Driver/Staff).
- `POST /api/vehicles/maintenance`: Report garage maintenance.
- `PATCH /api/vehicles/maintenance/:id`: Update maintenance status.
- `GET /api/vehicles/reports`: Fleet analytics and document expiry reports.
