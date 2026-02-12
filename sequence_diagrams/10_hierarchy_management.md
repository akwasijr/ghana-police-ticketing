# Organizational Hierarchy Management

> Cascading hierarchy: **Region > Division > District > Station**

## 1. Create Station (with Hierarchy Derivation)

```mermaid
sequenceDiagram
    participant Admin as Super Admin
    participant Dashboard
    participant API as API Server
    participant DB as Database

    Admin->>Dashboard: Navigate to Stations, click "Add Station"
    Dashboard->>API: GET /api/districts?isActive=true
    API->>DB: SELECT districts with division and region names
    DB-->>API: List of districts (with hierarchy)
    API-->>Dashboard: Districts list (pre-filtered by region/division)

    Dashboard->>Admin: Show form with district dropdown, station fields (name, code, address, phone, type)

    Admin->>Dashboard: Select district, fill station details, submit
    Dashboard->>API: POST /api/stations { name, code, districtId, address, phone, type }

    API->>DB: SELECT district WHERE id = districtId (get divisionId, regionId)
    alt District not found or inactive
        DB-->>API: Not found / inactive
        API-->>Dashboard: 404 District not found or inactive
        Dashboard-->>Admin: Show error
    else District valid
        DB-->>API: District { id, divisionId, regionId }

        API->>DB: SELECT station WHERE code = {code}
        alt Station code already exists
            DB-->>API: Conflict
            API-->>Dashboard: 409 Station code already in use
            Dashboard-->>Admin: Show error "Station code must be unique"
        else Code is unique
            DB-->>API: No conflict

            API->>DB: INSERT INTO stations (name, code, district_id, division_id, region_id, address, phone, type)
            Note right of DB: divisionId and regionId derived from the selected district
            DB-->>API: Station created

            API->>DB: INSERT audit_log (action: station:create, entityType: station)
            DB-->>API: Audit logged

            API-->>Dashboard: 201 Station { id, name, code, district, division, region }
            Dashboard-->>Admin: Show success with full hierarchy names
        end
    end
```

## 2. Deactivate Region (Cascade Protection)

```mermaid
sequenceDiagram
    participant Admin as Super Admin
    participant Dashboard
    participant API as API Server
    participant DB as Database

    Admin->>Dashboard: Select region, click "Deactivate"
    Dashboard->>Admin: Show confirmation dialog ("This will deactivate the region")
    Admin->>Dashboard: Confirm deactivation

    Dashboard->>API: DELETE /api/regions/{id}

    API->>DB: SELECT region WHERE id = {id}
    alt Region not found
        DB-->>API: Not found
        API-->>Dashboard: 404 Region not found
        Dashboard-->>Admin: Show error
    else Region found
        DB-->>API: Region record

        API->>DB: COUNT active divisions WHERE region_id = {id} AND is_active = true
        DB-->>API: Active division count

        alt Active divisions exist (count > 0)
            API-->>Dashboard: 409 Cannot deactivate - active divisions exist
            Dashboard-->>Admin: Show error "Deactivate all divisions in this region first"
            Note over Dashboard,Admin: Admin must deactivate divisions<br/>before deactivating the region
        else No active divisions (count = 0)
            API->>DB: UPDATE regions SET is_active = false WHERE id = {id}
            DB-->>API: Region deactivated

            API->>DB: INSERT audit_log (action: region:deactivate, severity: warning, entityType: region, entityId: {id})
            DB-->>API: Audit logged

            API-->>Dashboard: 200 Region deactivated
            Dashboard-->>Admin: Show success "Region has been deactivated"
        end
    end
```

## 3. Hierarchy Cascade Protection Summary

```mermaid
sequenceDiagram
    participant Admin as Super Admin
    participant API as API Server
    participant DB as Database

    Note over Admin,DB: Deactivation must follow bottom-up order

    Admin->>API: DELETE /api/stations/{id}
    API->>DB: COUNT active officers WHERE station_id = {id}
    alt Active officers exist
        API-->>Admin: 409 Reassign or deactivate officers first
    else No active officers
        API->>DB: UPDATE station SET is_active = false
        API-->>Admin: 200 Station deactivated
    end

    Admin->>API: DELETE /api/districts/{id}
    API->>DB: COUNT active stations WHERE district_id = {id}
    alt Active stations exist
        API-->>Admin: 409 Deactivate all stations first
    else No active stations
        API->>DB: UPDATE district SET is_active = false
        API-->>Admin: 200 District deactivated
    end

    Admin->>API: DELETE /api/divisions/{id}
    API->>DB: COUNT active districts WHERE division_id = {id}
    alt Active districts exist
        API-->>Admin: 409 Deactivate all districts first
    else No active districts
        API->>DB: UPDATE division SET is_active = false
        API-->>Admin: 200 Division deactivated
    end

    Admin->>API: DELETE /api/regions/{id}
    API->>DB: COUNT active divisions WHERE region_id = {id}
    alt Active divisions exist
        API-->>Admin: 409 Deactivate all divisions first
    else No active divisions
        API->>DB: UPDATE region SET is_active = false
        API-->>Admin: 200 Region deactivated
    end
```
