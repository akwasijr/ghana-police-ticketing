-- 000004: Seed offences and vehicle types

INSERT INTO offences (code, name, description, legal_basis, category, default_fine, min_fine, max_fine, points) VALUES
('SPD-001', 'Exceeding Speed Limit',              'Driving above the posted speed limit',                    'Road Traffic Act 2004, Section 3',   'speed',             200.00,  100.00,  500.00, 3),
('SPD-002', 'Speeding in School Zone',             'Exceeding speed limit within a designated school zone',   'Road Traffic Act 2004, Section 3(2)', 'speed',             300.00,  200.00,  800.00, 5),
('TSG-001', 'Running Red Light',                   'Failing to stop at a red traffic signal',                 'Road Traffic Regulations, Reg 54',    'traffic_signal',    250.00,  150.00,  600.00, 4),
('TSG-002', 'Ignoring Stop Sign',                  'Failing to stop at a stop sign',                          'Road Traffic Regulations, Reg 55',    'traffic_signal',    200.00,  100.00,  500.00, 3),
('LIC-001', 'Driving Without Valid License',       'Operating a motor vehicle without a valid driver license', 'Road Traffic Act 2004, Section 14',   'licensing',         500.00,  300.00, 1000.00, 6),
('LIC-002', 'Expired Vehicle Registration',        'Operating a vehicle with expired registration',           'Road Traffic Act 2004, Section 8',    'licensing',         300.00,  200.00,  600.00, 2),
('DOC-001', 'No Insurance Certificate',            'Driving without valid motor insurance',                   'Motor Vehicles (Third Party Insurance) Act', 'documentation', 400.00,  250.00,  800.00, 4),
('DOC-002', 'No Road Worthy Certificate',          'Operating a vehicle without a roadworthy certificate',    'Road Traffic Act 2004, Section 9',    'documentation',     350.00,  200.00,  700.00, 3),
('VEH-001', 'Defective Brake Lights',              'Operating a vehicle with non-functional brake lights',    'Road Traffic Regulations, Reg 23',    'vehicle_condition', 150.00,  100.00,  400.00, 2),
('VEH-002', 'Worn Tyres Below Legal Limit',        'Driving with tyre tread below the minimum legal depth',   'Road Traffic Regulations, Reg 21',    'vehicle_condition', 200.00,  100.00,  500.00, 3),
('DNG-001', 'Dangerous Driving',                   'Driving in a manner dangerous to the public',             'Road Traffic Act 2004, Section 1',    'dangerous_driving', 800.00,  500.00, 2000.00, 8),
('DNG-002', 'Using Mobile Phone While Driving',    'Using a handheld phone while operating a motor vehicle',  'Road Traffic Regulations, Reg 118',   'dangerous_driving', 300.00,  200.00,  600.00, 3),
('PRK-001', 'Illegal Parking',                     'Parking in a restricted or no-parking zone',              'Road Traffic Regulations, Reg 87',    'parking',           100.00,   50.00,  300.00, 1),
('OBS-001', 'Obstruction of Traffic',              'Causing unnecessary obstruction to traffic flow',         'Road Traffic Regulations, Reg 89',    'obstruction',       200.00,  100.00,  500.00, 2),
('OTH-001', 'Failure to Wear Seatbelt',           'Not wearing a seatbelt while the vehicle is in motion',   'Road Traffic Regulations, Reg 110',   'other',             100.00,   50.00,  250.00, 1);

INSERT INTO vehicle_types (name) VALUES
('Sedan'),
('SUV'),
('Pickup Truck'),
('Minibus (Trotro)'),
('Bus'),
('Motorcycle'),
('Tricycle (Pragya)'),
('Truck'),
('Articulated Truck'),
('Van');
