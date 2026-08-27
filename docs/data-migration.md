# Legacy Data Migration & CSV Bulk Ingestion Runbook

## 1. Overview & Ingestion Flow

The institution data migration platform facilitates seamless transition from legacy school databases or spreadsheet spreadsheets into St. Lawrence SMS without downtime or schema corruption.

```
+----------------+      +--------------------+      +--------------------+      +--------------------+
|  1. CSV Upload | ---> | 2. Server Validate | ---> | 3. Error Breakdown | ---> | 4. Atomic Ingest   |
| (Drag & Drop)  |      |  (Schema & Dupes)  |      |   & Review Preview |      | (DB Transaction)   |
+----------------+      +--------------------+      +--------------------+      +--------------------+
```

---

## 2. Student Ingestion CSV Specification

### Required Header Schema:
```csv
first_name,last_name,email,admission_number,gender,date_of_birth
```

### Optional Header Schema:
```csv
phone,whatsapp_number,admission_date
```

### Validation Rules:
1. `first_name`, `last_name`: Non-empty strings.
2. `email`: Valid RFC 5322 format, unique across all users in the system and within the uploaded file.
3. `admission_number`: Alphanumeric string, unique across student records.
4. `gender`: Must be one of `MALE`, `FEMALE`, `OTHER`.
5. `date_of_birth`: ISO 8601 string (`YYYY-MM-DD`).

---

## 3. Atomic Ingestion Guarantees

- **Dry-run validation:** Step 1 never writes to primary user or student tables; it records a temporary preview in `DataImportLog` and `DataImportRow`.
- **Row-level error isolation:** Invalid rows are flagged with specific human-readable errors without failing valid rows in preview.
- **Transactional commit:** Upon confirmation (`POST /api/import/students/confirm`), each valid row creates both the `User` identity and `Student` profile inside an isolated Prisma `$transaction` block.
- **Audit tracking:** All import attempts, row counts, and error summaries are permanently stored in `DataImportLog`.
