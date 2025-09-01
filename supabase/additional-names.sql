-- Additional 70 names from new countries and regions
-- Run this after the main social-proof-setup.sql script

INSERT INTO social_proof_names (first_name, last_name, country, country_code, flag_emoji, region) VALUES
-- Middle East
('Ahmad', 'Al-Rashid', 'Riyadh', 'SA', '🇸🇦', 'Middle East'),
('Fatima', 'Al-Zahra', 'Jeddah', 'SA', '🇸🇦', 'Middle East'),
('Omar', 'Al-Mansouri', 'Abu Dhabi', 'AE', '🇦🇪', 'Middle East'),
('Layla', 'Al-Hashimi', 'Dubai', 'AE', '🇦🇪', 'Middle East'),
('Khalid', 'Al-Sabah', 'Kuwait City', 'KW', '🇰🇼', 'Middle East'),
('Noor', 'Al-Thani', 'Doha', 'QA', '🇶🇦', 'Middle East'),
('Youssef', 'Al-Maktoum', 'Sharjah', 'AE', '🇦🇪', 'Middle East'),
('Aisha', 'Al-Nahyan', 'Al Ain', 'AE', '🇦🇪', 'Middle East'),
('Hassan', 'Al-Khalifa', 'Manama', 'BH', '🇧🇭', 'Middle East'),
('Zahra', 'Al-Sabah', 'Salmiya', 'KW', '🇰🇼', 'Middle East'),

-- Central Asia
('Aziz', 'Karimov', 'Tashkent', 'UZ', '🇺🇿', 'Central Asia'),
('Dilbar', 'Nazarbayeva', 'Almaty', 'KZ', '🇰🇿', 'Central Asia'),
('Rustam', 'Tajik', 'Dushanbe', 'TJ', '🇹🇯', 'Central Asia'),
('Gulnara', 'Bishkek', 'Bishkek', 'KG', '🇰🇬', 'Central Asia'),
('Farhad', 'Ashgabat', 'Ashgabat', 'TM', '🇹🇲', 'Central Asia'),
('Mariam', 'Baku', 'Baku', 'AZ', '🇦🇿', 'Central Asia'),
('Eldar', 'Yerevan', 'Yerevan', 'AM', '🇦🇲', 'Central Asia'),
('Anahit', 'Tbilisi', 'Tbilisi', 'GE', '🇬🇪', 'Central Asia'),
('Bakhtiyar', 'Astana', 'Nur-Sultan', 'KZ', '🇰🇿', 'Central Asia'),
('Shirin', 'Samarkand', 'Samarkand', 'UZ', '🇺🇿', 'Central Asia'),

-- Southeast Asia (New Countries)
('Somsak', 'Thongchai', 'Bangkok', 'TH', '🇹🇭', 'Southeast Asia'),
('Ratree', 'Srisai', 'Chiang Mai', 'TH', '🇹🇭', 'Southeast Asia'),
('Vong', 'Sok', 'Phnom Penh', 'KH', '🇰🇭', 'Southeast Asia'),
('Sokha', 'Chan', 'Siem Reap', 'KH', '🇰🇭', 'Southeast Asia'),
('Thong', 'Souvanh', 'Vientiane', 'LA', '🇱🇦', 'Southeast Asia'),
('Khamla', 'Phommachanh', 'Luang Prabang', 'LA', '🇱🇦', 'Southeast Asia'),
('Myint', 'Aung', 'Yangon', 'MM', '🇲🇲', 'Southeast Asia'),
('Aung', 'Myint', 'Mandalay', 'MM', '🇲🇲', 'Southeast Asia'),
('Phuong', 'Nguyen', 'Hanoi', 'VN', '🇻🇳', 'Southeast Asia'),
('Minh', 'Tran', 'Ho Chi Minh City', 'VN', '🇻🇳', 'Southeast Asia'),

-- South Asia (New Countries)
('Rajesh', 'Sharma', 'Kathmandu', 'NP', '🇳🇵', 'South Asia'),
('Priya', 'Patel', 'Pokhara', 'NP', '🇳🇵', 'South Asia'),
('Abdul', 'Rahman', 'Dhaka', 'BD', '🇧🇩', 'South Asia'),
('Nusrat', 'Begum', 'Chittagong', 'BD', '🇧🇩', 'South Asia'),
('Malik', 'Hussain', 'Lahore', 'PK', '🇵🇰', 'South Asia'),
('Sana', 'Khan', 'Karachi', 'PK', '🇵🇰', 'South Asia'),
('Dinesh', 'Fernando', 'Colombo', 'LK', '🇱🇰', 'South Asia'),
('Kumari', 'Perera', 'Kandy', 'LK', '🇱🇰', 'South Asia'),
('Rahim', 'Ahmed', 'Male', 'MV', '🇲🇻', 'South Asia'),
('Aisha', 'Mohammed', 'Addu City', 'MV', '🇲🇻', 'South Asia'),

-- Eastern Europe (New Countries)
('Vladimir', 'Ivanov', 'Minsk', 'BY', '🇧🇾', 'Eastern Europe'),
('Natasha', 'Petrova', 'Gomel', 'BY', '🇧🇾', 'Eastern Europe'),
('Igor', 'Popov', 'Chisinau', 'MD', '🇲🇩', 'Eastern Europe'),
('Elena', 'Kuznetsova', 'Balti', 'MD', '🇲🇩', 'Eastern Europe'),
('Sergei', 'Smirnov', 'Kiev', 'UA', '🇺🇦', 'Eastern Europe'),
('Olena', 'Koval', 'Lviv', 'UA', '🇺🇦', 'Eastern Europe'),
('Dimitri', 'Georgiev', 'Sofia', 'BG', '🇧🇬', 'Eastern Europe'),
('Maria', 'Dimitrova', 'Plovdiv', 'BG', '🇧🇬', 'Eastern Europe'),
('Ivan', 'Popescu', 'Bucharest', 'RO', '🇷🇴', 'Eastern Europe'),
('Elena', 'Ionescu', 'Cluj-Napoca', 'RO', '🇷🇴', 'Eastern Europe'),

-- Balkans
('Zoran', 'Jovanovic', 'Belgrade', 'RS', '🇷🇸', 'Balkans'),
('Jelena', 'Nikolic', 'Novi Sad', 'RS', '🇷🇸', 'Balkans'),
('Marko', 'Horvat', 'Zagreb', 'HR', '🇭🇷', 'Balkans'),
('Ana', 'Kovac', 'Split', 'HR', '🇭🇷', 'Balkans'),
('Nikola', 'Novak', 'Ljubljana', 'SI', '🇸🇮', 'Balkans'),
('Maja', 'Krajnc', 'Maribor', 'SI', '🇸🇮', 'Balkans'),
('Stefan', 'Petrovski', 'Skopje', 'MK', '🇲🇰', 'Balkans'),
('Elena', 'Stojanovska', 'Bitola', 'MK', '🇲🇰', 'Balkans'),
('Goran', 'Kovacevic', 'Sarajevo', 'BA', '🇧🇦', 'Balkans'),
('Amira', 'Hodzic', 'Banja Luka', 'BA', '🇧🇦', 'Balkans'),

-- Caucasus
('Giorgi', 'Mamulashvili', 'Tbilisi', 'GE', '🇬🇪', 'Caucasus'),
('Nino', 'Kapanadze', 'Batumi', 'GE', '🇬🇪', 'Caucasus'),
('Arman', 'Hakobyan', 'Yerevan', 'AM', '🇦🇲', 'Caucasus'),
('Ani', 'Sargsyan', 'Gyumri', 'AM', '🇦🇲', 'Caucasus'),
('Ilham', 'Aliyev', 'Baku', 'AZ', '🇦🇿', 'Caucasus'),
('Aysu', 'Mammadova', 'Ganja', 'AZ', '🇦🇿', 'Caucasus'),

-- North Africa
('Karim', 'Hassan', 'Cairo', 'EG', '🇪🇬', 'North Africa'),
('Amina', 'Mahmoud', 'Alexandria', 'EG', '🇪🇬', 'North Africa'),
('Tariq', 'Benjelloun', 'Casablanca', 'MA', '🇲🇦', 'North Africa'),
('Fatima', 'Alaoui', 'Rabat', 'MA', '🇲🇦', 'North Africa'),
('Ahmed', 'Bouazza', 'Algiers', 'DZ', '🇩🇿', 'North Africa'),
('Leila', 'Bendjama', 'Oran', 'DZ', '🇩🇿', 'North Africa'),
('Hassan', 'Ben Ali', 'Tunis', 'TN', '🇹🇳', 'North Africa'),
('Nour', 'Ben Salem', 'Sfax', 'TN', '🇹🇳', 'North Africa'),
('Omar', 'Al-Mahmoudi', 'Tripoli', 'LY', '🇱🇾', 'North Africa'),
('Aisha', 'Al-Zahra', 'Benghazi', 'LY', '🇱🇾', 'North Africa'),

-- Sub-Saharan Africa (New Countries)
('Kwame', 'Mensah', 'Accra', 'GH', '🇬🇭', 'Sub-Saharan Africa'),
('Abena', 'Owusu', 'Kumasi', 'GH', '🇬🇭', 'Sub-Saharan Africa'),
('Kemi', 'Adebayo', 'Lagos', 'NG', '🇳🇬', 'Sub-Saharan Africa'),
('Adebayo', 'Oke', 'Abuja', 'NG', '🇳🇬', 'Sub-Saharan Africa'),
('Thabo', 'Mokoena', 'Johannesburg', 'ZA', '🇿🇦', 'Sub-Saharan Africa'),
('Zanele', 'Nkosi', 'Cape Town', 'ZA', '🇿🇦', 'Sub-Saharan Africa'),
('Kofi', 'Owusu', 'Kumasi', 'GH', '🇬🇭', 'Sub-Saharan Africa'),
('Ama', 'Asante', 'Accra', 'GH', '🇬🇭', 'Sub-Saharan Africa'),
('Mamadou', 'Diallo', 'Dakar', 'SN', '🇸🇳', 'Sub-Saharan Africa'),
('Fatou', 'Cisse', 'Saint-Louis', 'SN', '🇸🇳', 'Sub-Saharan Africa');
