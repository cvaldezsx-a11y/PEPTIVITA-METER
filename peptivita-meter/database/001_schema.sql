-- ============================================================
-- PEPTIVITA METER — Esquema de Base de Datos
-- PostgreSQL / Supabase
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: patients (Pacientes registrados)
-- ============================================================
CREATE TABLE patients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cedula        VARCHAR(20)  UNIQUE NOT NULL,
  full_name     VARCHAR(200) NOT NULL,
  email         VARCHAR(200),
  phone         VARCHAR(30),
  birth_date    DATE,
  gender        VARCHAR(10) CHECK (gender IN ('M','F','Other')),
  goal_weight   NUMERIC(5,2),       -- Meta de peso en kg
  goal_fat_pct  NUMERIC(4,1),       -- Meta % grasa corporal
  initial_weight NUMERIC(5,2),      -- Peso en primera consulta
  notes_general TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: moderators (Médicos / Especialistas)
-- ============================================================
CREATE TABLE moderators (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supabase_uid  UUID UNIQUE,       -- Auth UID de Supabase
  full_name     VARCHAR(200) NOT NULL,
  email         VARCHAR(200) UNIQUE NOT NULL,
  role          VARCHAR(30) DEFAULT 'editor' CHECK (role IN ('admin','editor','viewer')),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: consultations (Consultas / Visitas indexadas por fecha)
-- ============================================================
CREATE TABLE consultations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  moderator_id    UUID REFERENCES moderators(id),
  consultation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes_specialist TEXT,           -- Notas del especialista
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, consultation_date)
);

-- ============================================================
-- TABLA: anthropometrics (Mediciones antropométricas)
-- ============================================================
CREATE TABLE anthropometrics (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id   UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  -- Básicos
  age               INTEGER,
  height_cm         NUMERIC(5,1),
  weight_kg         NUMERIC(5,2),
  -- Perímetros corporales (cm)
  neck_cm           NUMERIC(5,1),
  wrist_cm          NUMERIC(4,1),
  bicep_left_cm     NUMERIC(5,1),
  bicep_right_cm    NUMERIC(5,1),
  chest_cm          NUMERIC(5,1),
  waist_cm          NUMERIC(5,1),
  hip_cm            NUMERIC(5,1),
  thigh_left_cm     NUMERIC(5,1),
  thigh_right_cm    NUMERIC(5,1),
  -- Composición corporal
  body_fat_pct      NUMERIC(4,1),
  muscle_mass_kg    NUMERIC(5,2),
  -- Signos vitales
  bp_systolic       INTEGER,
  bp_diastolic      INTEGER,
  heart_rate        INTEGER,
  -- KPIs calculados (guardados para historial)
  bmi               NUMERIC(4,1) GENERATED ALWAYS AS (
                      CASE WHEN height_cm > 0
                      THEN weight_kg / POWER(height_cm/100, 2)
                      ELSE NULL END
                    ) STORED,
  waist_hip_ratio   NUMERIC(4,3) GENERATED ALWAYS AS (
                      CASE WHEN hip_cm > 0
                      THEN waist_cm / hip_cm
                      ELSE NULL END
                    ) STORED,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: peptide_treatments (Tratamientos con péptidos)
-- ============================================================
CREATE TABLE peptide_treatments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id   UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  peptide_name      VARCHAR(100) NOT NULL,
  is_custom         BOOLEAN DEFAULT FALSE,  -- TRUE si es texto libre
  dose_value        NUMERIC(8,2),
  dose_unit         VARCHAR(10) CHECK (dose_unit IN ('mcg','mg','IU','ml')),
  frequency         VARCHAR(50),            -- 'daily','weekly','EOD', etc.
  administration_route VARCHAR(50),         -- 'subcutaneous','oral','topical'
  cycle_start       DATE,
  cycle_end         DATE,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Péptidos predefinidos (catálogo)
CREATE TABLE peptide_catalog (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) UNIQUE NOT NULL,
  category    VARCHAR(50),                  -- 'GLP-1','GH Secretagogue','Repair','Cosmetic'
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE
);

INSERT INTO peptide_catalog (name, category) VALUES
  ('Retatrutide',   'GLP-1/GIP/Glucagon'),
  ('Tirzepatide',   'GLP-1/GIP'),
  ('CJC-1295',      'GH Secretagogue'),
  ('Ipamorelin',    'GH Secretagogue'),
  ('BPC-157',       'Repair'),
  ('GHK-Cu',        'Cosmetic/Repair'),
  ('Semaglutide',   'GLP-1'),
  ('TB-500',        'Repair'),
  ('Sermorelin',    'GH Secretagogue'),
  ('AOD-9604',      'Fat Loss');

-- ============================================================
-- TABLA: lab_study_types (Tipos de estudios de laboratorio)
-- ============================================================
CREATE TABLE lab_study_types (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) UNIQUE NOT NULL,  -- 'Perfil Lipídico'
  category    VARCHAR(50),                   -- 'Metabolic','Hepatic', etc.
  description TEXT
);

INSERT INTO lab_study_types (name, category) VALUES
  ('Perfil Lipídico',               'Metabolic'),
  ('Glicemia en ayunas',            'Metabolic'),
  ('Hemoglobina Glicosilada HbA1c', 'Metabolic'),
  ('Marcadores Hepáticos',          'Hepatic'),
  ('Hemograma Completo',            'Hematologic'),
  ('Perfil Tiroideo',               'Hormonal'),
  ('Físico-Químico de Orina',       'Renal'),
  ('Perfil Renal',                  'Renal'),
  ('Hormonas Sexuales',             'Hormonal'),
  ('Electrolitos',                  'Metabolic'),
  ('Proteína C Reactiva',           'Inflammatory'),
  ('Vitamina D',                    'Nutritional');

-- ============================================================
-- TABLA: lab_parameters (Parámetros individuales de cada estudio)
-- ============================================================
CREATE TABLE lab_parameters (
  id              SERIAL PRIMARY KEY,
  study_type_id   INTEGER NOT NULL REFERENCES lab_study_types(id),
  name            VARCHAR(100) NOT NULL,   -- 'Colesterol LDL'
  unit            VARCHAR(30),             -- 'mg/dL'
  ref_min         NUMERIC(10,3),
  ref_max         NUMERIC(10,3),
  ref_text        VARCHAR(100),            -- Para valores cualitativos: 'Negativo'
  is_qualitative  BOOLEAN DEFAULT FALSE,
  UNIQUE(study_type_id, name)
);

-- Parámetros de Perfil Lipídico
INSERT INTO lab_parameters (study_type_id, name, unit, ref_min, ref_max) VALUES
  (1, 'Colesterol Total',   'mg/dL', 0,   200),
  (1, 'Colesterol LDL',     'mg/dL', 0,   130),
  (1, 'Colesterol HDL (H)', 'mg/dL', 40,  999),
  (1, 'Colesterol HDL (M)', 'mg/dL', 50,  999),
  (1, 'Triglicéridos',      'mg/dL', 0,   150),
  (1, 'VLDL',               'mg/dL', 0,   30),
  -- Glicemia
  (2, 'Glicemia en ayunas', 'mg/dL', 70,  99),
  -- HbA1c
  (3, 'HbA1c',              '%',     0,   5.7),
  -- Hepáticos
  (4, 'TGO / AST',          'U/L',   0,   40),
  (4, 'TGP / ALT',          'U/L',   0,   40),
  (4, 'GGT',                'U/L',   0,   60),
  (4, 'Fosfatasa Alcalina', 'U/L',   44,  147),
  (4, 'Bilirrubina Total',  'mg/dL', 0.2, 1.2),
  -- Hemograma
  (5, 'Hemoglobina',        'g/dL',  12,  17.5),
  (5, 'Hematocrito',        '%',     36,  52),
  (5, 'Leucocitos',         'x10³/μL', 4.5, 11),
  (5, 'Plaquetas',          'x10³/μL', 150, 400),
  -- Tiroides
  (6, 'TSH',                'mUI/L', 0.4, 4.0),
  (6, 'T3 libre',           'pg/mL', 2.3, 4.2),
  (6, 'T4 libre',           'ng/dL', 0.8, 1.8),
  -- Perfil Renal
  (8, 'Creatinina',         'mg/dL', 0.6, 1.2),
  (8, 'BUN / Urea',         'mg/dL', 7,   25),
  (8, 'Ácido Úrico (H)',    'mg/dL', 3.4, 7.0),
  (8, 'Ácido Úrico (M)',    'mg/dL', 2.4, 6.0);

-- ============================================================
-- TABLA: lab_results (Resultados de laboratorio por consulta)
-- ============================================================
CREATE TABLE lab_results (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id   UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  parameter_id      INTEGER REFERENCES lab_parameters(id),
  custom_parameter  VARCHAR(100),     -- Si no está en catálogo
  custom_unit       VARCHAR(30),
  custom_ref_min    NUMERIC(10,3),
  custom_ref_max    NUMERIC(10,3),
  value_numeric     NUMERIC(10,3),
  value_text        VARCHAR(100),     -- Para cualitativos
  -- Clasificación (se actualiza vía trigger)
  classification    VARCHAR(10) DEFAULT 'UNCLASSIFIED',
  result_date       DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: progress_photos (Fotos de progreso)
-- ============================================================
CREATE TABLE progress_photos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id   UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  angle             VARCHAR(20) CHECK (angle IN ('front','side','back')),
  storage_path      TEXT NOT NULL,    -- Path en Supabase Storage
  photo_date        DATE DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista: Última consulta de cada paciente con peso actual
CREATE VIEW v_patient_latest AS
SELECT
  p.id,
  p.cedula,
  p.full_name,
  p.initial_weight,
  p.goal_weight,
  a.weight_kg as current_weight,
  a.body_fat_pct,
  a.waist_hip_ratio,
  a.bmi,
  c.consultation_date as last_visit,
  ROUND(((p.initial_weight - a.weight_kg) / p.initial_weight * 100), 1) as pct_weight_lost
FROM patients p
LEFT JOIN LATERAL (
  SELECT c.* FROM consultations c
  WHERE c.patient_id = p.id
  ORDER BY c.consultation_date DESC LIMIT 1
) c ON TRUE
LEFT JOIN anthropometrics a ON a.consultation_id = c.id
WHERE p.is_active = TRUE;

-- Vista: Analíticas con clasificación por colores
CREATE VIEW v_lab_results_classified AS
SELECT
  lr.id,
  lr.consultation_id,
  c.patient_id,
  c.consultation_date,
  COALESCE(lst.name, 'Personalizado') as study_type,
  COALESCE(lp.name, lr.custom_parameter) as parameter_name,
  COALESCE(lp.unit, lr.custom_unit) as unit,
  lr.value_numeric,
  lr.value_text,
  lr.classification,
  COALESCE(lp.ref_min, lr.custom_ref_min) as ref_min,
  COALESCE(lp.ref_max, lr.custom_ref_max) as ref_max
FROM lab_results lr
JOIN consultations c ON c.id = lr.consultation_id
LEFT JOIN lab_parameters lp ON lp.id = lr.parameter_id
LEFT JOIN lab_study_types lst ON lst.id = lp.study_type_id;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Seguridad por fila
-- ============================================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE anthropometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- Moderadores pueden ver todo
CREATE POLICY "moderators_full_access" ON patients
  FOR ALL USING (
    auth.uid() IN (SELECT supabase_uid FROM moderators WHERE is_active = TRUE)
  );

-- Pacientes solo ven sus propios datos
-- (Requiere auth custom con cedula, ver implementación en /frontend/src/lib/auth.ts)

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX idx_consultations_patient ON consultations(patient_id, consultation_date DESC);
CREATE INDEX idx_anthropometrics_consult ON anthropometrics(consultation_id);
CREATE INDEX idx_lab_results_consult ON lab_results(consultation_id);
CREATE INDEX idx_lab_results_param ON lab_results(parameter_id);
CREATE INDEX idx_photos_patient ON progress_photos(patient_id, photo_date DESC);
CREATE INDEX idx_patients_cedula ON patients(cedula);

-- ============================================================
-- TRIGGER: clasificación automática de resultados de laboratorio
-- ============================================================
CREATE OR REPLACE FUNCTION fn_classify_lab_result()
RETURNS TRIGGER AS $$
DECLARE
  v_min NUMERIC;
  v_max NUMERIC;
BEGIN
  IF NEW.value_numeric IS NULL THEN
    NEW.classification := 'QUALITATIVE';
  ELSIF NEW.parameter_id IS NOT NULL THEN
    SELECT ref_min, ref_max INTO v_min, v_max
    FROM lab_parameters WHERE id = NEW.parameter_id;

    IF NEW.value_numeric < v_min THEN
      NEW.classification := 'LOW';
    ELSIF NEW.value_numeric > v_max THEN
      NEW.classification := 'HIGH';
    ELSE
      NEW.classification := 'NORMAL';
    END IF;
  ELSIF NEW.custom_ref_min IS NOT NULL AND NEW.custom_ref_max IS NOT NULL THEN
    IF NEW.value_numeric < NEW.custom_ref_min THEN
      NEW.classification := 'LOW';
    ELSIF NEW.value_numeric > NEW.custom_ref_max THEN
      NEW.classification := 'HIGH';
    ELSE
      NEW.classification := 'NORMAL';
    END IF;
  ELSE
    NEW.classification := 'UNCLASSIFIED';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_classify_lab_result
  BEFORE INSERT OR UPDATE ON lab_results
  FOR EACH ROW EXECUTE FUNCTION fn_classify_lab_result();
