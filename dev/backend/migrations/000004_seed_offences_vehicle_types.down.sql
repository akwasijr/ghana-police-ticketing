-- 000004: Remove seed offences and vehicle types

DELETE FROM vehicle_types WHERE name IN (
    'Sedan', 'SUV', 'Pickup Truck', 'Minibus (Trotro)', 'Bus',
    'Motorcycle', 'Tricycle (Pragya)', 'Truck', 'Articulated Truck', 'Van'
);

DELETE FROM offences WHERE code IN (
    'SPD-001', 'SPD-002', 'TSG-001', 'TSG-002', 'LIC-001', 'LIC-002',
    'DOC-001', 'DOC-002', 'VEH-001', 'VEH-002', 'DNG-001', 'DNG-002',
    'PRK-001', 'OBS-001', 'OTH-001'
);
