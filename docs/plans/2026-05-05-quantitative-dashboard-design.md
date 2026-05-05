## Quantitative Dashboard Refactor

### Goal

Refactor the project from an identifiable patient dashboard into a quantitative chronic-care dashboard. The system must accept CSV/XLS/XLSX uploads, generate aggregate metrics and charts, and never persist patient names, IDs, or other sensitive row-level identifiers.

### Scope

- Keep the upload workflow and latest-upload dashboard model.
- Remove persistence of patient entities and any sensitive identifiers.
- Store only anonymous aggregate buckets derived from uploaded files.
- Keep user-facing copy in Portuguese.
- Move code identifiers to English and improve structure with cleaner boundaries.

### Recommended Approach

Use an aggregate snapshot model instead of row-level storage.

Each imported row is reduced in memory to non-identifying dimensions:

- condition
- age group
- sex
- race/color
- family welfare flag
- neighborhood
- care-risk flags

Rows with the same dimension set are merged into a single bucket with a `count`. The latest upload remains the source for dashboard queries.

### Data Model

Replace the current patient persistence flow with:

- `Upload`: metadata about the imported file and uploader
- `AggregateBucket`: anonymous count bucket linked to an upload

Each bucket stores:

- condition
- age group
- sex
- race/color
- family welfare
- neighborhood
- `needsMedicalCare`
- `needsNursingCare`
- `needsHomeVisit`
- `hasStaleBloodPressureMeasurement`
- `hasStaleHbA1c`
- `count`

### Application Flow

1. Upload action validates the file.
2. Parser reads rows and maps only non-identifying attributes.
3. Aggregation service groups rows into buckets in memory.
4. Upload use case persists the upload plus aggregate buckets.
5. Dashboard use case loads the latest upload buckets, applies filters, and derives cards/charts.

### Dashboard Behavior

The home page will show only:

- KPI cards
- condition split
- top neighborhoods
- care coverage charts
- quantitative breakdowns by demographic filters

Removed:

- patient search
- patient table
- pagination of patient rows
- any display or storage of names/IDs

### Validation

- Run `eslint`
- Run `vitest`
- Run `next build` if the data-model refactor stabilizes cleanly

### Incremental Delivery

1. Replace schema and backend pipeline
2. Replace dashboard DTOs/use cases
3. Rebuild home page around aggregate data
4. Validate and commit each stable checkpoint
