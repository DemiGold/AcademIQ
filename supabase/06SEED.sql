-- ============================================================
-- ACADEMIQ — SEED DATA
-- Run once. Safe to re-run (cleans itself first).
-- Wrapped in a transaction — rolls back on any error.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. CLEAR PREVIOUS SEED
-- ------------------------------------------------------------
delete from exam_answers;
delete from exam_attempts;
delete from tokens;
delete from questions;
delete from topics;
delete from courses;
delete from auth.users where email like '%@seed.test';

-- ------------------------------------------------------------
-- 2. HELPER: create a test student (auth + profile)
-- ------------------------------------------------------------
create or replace function seed_test_student(
  p_email text,
  p_username text,
  p_full_name text,
  p_student_id text,
  p_department text,
  p_academic_year text,
  p_premium boolean default false
) returns uuid
language plpgsql security definer set search_path = public, auth, extensions as $$
declare
  v_uid uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_uid, 'authenticated', 'authenticated',
    p_email,
    crypt('seed-password-123', gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', p_full_name),
    now(), now()
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_uid,
    jsonb_build_object('sub', v_uid::text, 'email', p_email),
    'email', p_email,
    now(), now(), now()
  );

  update profiles set
    username = p_username,
    student_id = p_student_id,
    department = p_department,
    academic_year = p_academic_year,
    premium_expires_at = case when p_premium then now() + interval '60 days' else null end
  where id = v_uid;

  return v_uid;
end $$;

-- ------------------------------------------------------------
-- 3. HELPER: create a random exam attempt for a user
-- ------------------------------------------------------------
create or replace function seed_random_attempt(
  p_user_id uuid,
  p_course_id uuid,
  p_correct_bias numeric default 0.65
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_attempt_id uuid := gen_random_uuid();
  v_client uuid := gen_random_uuid();
  v_total int;
  v_correct int;
  v_score int;
  v_when timestamptz := now() - (random() * interval '21 days');
begin
  select count(*) into v_total
  from questions where course_id = p_course_id and status = 'published';
  if v_total = 0 then return null; end if;

  insert into exam_attempts (
    id, client_uuid, user_id, course_id,
    score_percent, correct_count, total_questions, created_at
  ) values (
    v_attempt_id, v_client, p_user_id, p_course_id,
    0, 0, v_total, v_when
  );

  insert into exam_answers (attempt_id, question_id, selected_index, is_correct, created_at)
  select
    v_attempt_id, q.id,
    case when random() < p_correct_bias
         then q.correct_index
         else ((q.correct_index + 1 + floor(random() * 3)::int) % 4)
    end,
    false,
    v_when + (random() * interval '20 minutes')
  from questions q
  where q.course_id = p_course_id and q.status = 'published';

  update exam_answers ea
  set is_correct = (ea.selected_index = q.correct_index)
  from questions q
  where ea.question_id = q.id and ea.attempt_id = v_attempt_id;

  select count(*), count(*) filter (where is_correct)
  into v_total, v_correct
  from exam_answers where attempt_id = v_attempt_id;

  v_score := round(100.0 * v_correct / nullif(v_total, 0));

  update exam_attempts
  set correct_count = v_correct, total_questions = v_total, score_percent = v_score
  where id = v_attempt_id;

  return v_attempt_id;
end $$;

-- ------------------------------------------------------------
-- 4. COURSES
-- ------------------------------------------------------------
insert into courses (code, name) values
  ('MTH102', 'Elementary Mathematics II'),
  ('GST112', 'Communication in English II'),
  ('PHY102', 'General Physics II'),
  ('CHM102', 'General Chemistry II'),
  ('BIO102', 'General Biology II'),
  ('COS102', 'Introduction to Computer Science'),
  ('STA102', 'Statistics for Physical Sciences');

-- ------------------------------------------------------------
-- 5. TOPICS
-- ------------------------------------------------------------
insert into topics (course_id, name)
select c.id, t.n from courses c cross join (values
  ('Integration'),('Vectors and Geometry'),('Sequences and Series')
) as t(n) where c.code = 'MTH102';

insert into topics (course_id, name)
select c.id, t.n from courses c cross join (values
  ('Essay Writing'),('Comprehension'),('Summary Writing'),('Grammar')
) as t(n) where c.code = 'GST112';

insert into topics (course_id, name)
select c.id, t.n from courses c cross join (values
  ('Electricity'),('Magnetism'),('Waves and Optics'),('Thermodynamics')
) as t(n) where c.code = 'PHY102';

insert into topics (course_id, name)
select c.id, t.n from courses c cross join (values
  ('Atomic Structure'),('Chemical Bonding'),('Organic Chemistry'),('Electrochemistry')
) as t(n) where c.code = 'CHM102';

insert into topics (course_id, name)
select c.id, t.n from courses c cross join (values
  ('Cell Biology'),('Genetics'),('Ecology')
) as t(n) where c.code = 'BIO102';

insert into topics (course_id, name)
select c.id, t.n from courses c cross join (values
  ('Algorithms'),('Programming Basics'),('Number Systems')
) as t(n) where c.code = 'COS102';

insert into topics (course_id, name)
select c.id, t.n from courses c cross join (values
  ('Descriptive Statistics'),('Probability'),('Distributions')
) as t(n) where c.code = 'STA102';

-- ------------------------------------------------------------
-- 6. QUESTIONS
-- ------------------------------------------------------------
-- Helper to insert a question by course code + topic name
create or replace function seed_q(
  p_course text, p_topic text, p_q text,
  p_a text, p_b text, p_c text, p_d text,
  p_correct int, p_expl text, p_free boolean default false, p_status text default 'published'
) returns void
language plpgsql as $$
begin
  insert into questions (course_id, topic_id, question_text, options, correct_index, explanation, is_free, status, institution, academic_session, semester)
  select c.id, t.id, p_q,
         jsonb_build_array(p_a, p_b, p_c, p_d),
         p_correct, p_expl, p_free, p_status,
         'UNILAG', '2023/2024', '2nd'
  from courses c
  join topics t on t.course_id = c.id
  where c.code = p_course and t.name = p_topic;
end $$;

-- MTH102 — Integration
select seed_q('MTH102','Integration','What is the integral of 2x dx?',
  'x² + C','2x² + C','x + C','2 + C',0,
  'The power rule gives ∫2x dx = x² + C.', true);
select seed_q('MTH102','Integration','What is ∫cos x dx?',
  '-sin x + C','sin x + C','cos x + C','-cos x + C',1,
  'The derivative of sin x is cos x.');
select seed_q('MTH102','Integration','What is ∫eˣ dx?',
  'eˣ + C','xeˣ + C','e^(x+1) + C','ln(x) + C',0,
  'eˣ is its own derivative and integral.');
select seed_q('MTH102','Integration','What is ∫(1/x) dx?',
  'x + C','1/x² + C','ln|x| + C','-1/x² + C',2,
  'Standard result: ∫(1/x) dx = ln|x| + C.');
select seed_q('MTH102','Integration','What is ∫sec²x dx?',
  'tan x + C','sec x + C','cot x + C','csc x + C',0,
  'Derivative of tan x is sec²x.');

-- MTH102 — Vectors
select seed_q('MTH102','Vectors and Geometry','If a = (3, 4), what is |a|?',
  '3','5','7','12',1,'|a| = √(3² + 4²) = 5.', true);
select seed_q('MTH102','Vectors and Geometry','The dot product of (1,2) and (3,4) is?',
  '7','9','11','14',2,'1·3 + 2·4 = 11.');
select seed_q('MTH102','Vectors and Geometry','Two vectors are perpendicular when their dot product is?',
  '0','1','-1','Undefined',0,'Perpendicular ⟺ dot product = 0.');

-- MTH102 — Sequences
select seed_q('MTH102','Sequences and Series','What is the next term in 2, 4, 8, 16, ...?',
  '18','20','24','32',3,'Each term doubles.');
select seed_q('MTH102','Sequences and Series','Sum of infinite geometric series with |r|<1 is?',
  'a·r','a/(1-r)','a(1-r)','a·r/(1-r)',1,'Convergence formula for geometric series.');

-- GST112 — Essay Writing
select seed_q('GST112','Essay Writing','The main argument of an essay is called the?',
  'Introduction','Thesis','Conclusion','Topic',1,
  'The thesis is the central argument.', true);
select seed_q('GST112','Essay Writing','A paragraph should contain how many main ideas?',
  'One','Two','Three','Unlimited',0,'One idea per paragraph.');
select seed_q('GST112','Essay Writing','The introductory paragraph should end with?',
  'A quote','A summary','A thesis statement','A question',2,
  'Thesis statements go at the end of the intro.');

-- GST112 — Comprehension
select seed_q('GST112','Comprehension','The main idea of a passage is the?',
  'First sentence','Longest sentence','Central message','Last sentence',2,
  'Main idea is the central message of the passage.', true);
select seed_q('GST112','Comprehension','Skimming means reading for?',
  'General understanding','Every detail','Specific numbers','Grammar rules',0,
  'Skimming = fast reading for gist.');

-- GST112 — Grammar
select seed_q('GST112','Grammar','Choose the correct sentence:',
  'Me and her went to the market.','She and I went to the market.','Her and I went to the market.','Me and she went to the market.',1,
  'Use subject pronouns in the subject position.', true);
select seed_q('GST112','Grammar','Identify the verb: "The cat sleeps."',
  'sleeps','cat','The','(none)',0,'"Sleeps" is the action word.');

-- PHY102 — Electricity
select seed_q('PHY102','Electricity','The unit of electrical resistance is?',
  'Ohm','Volt','Ampere','Watt',0,'Resistance = Ohm (Ω).', true);
select seed_q('PHY102','Electricity','Ohm''s law states V equals?',
  'I/R','IR','R/I','I²R',1,'V = IR.');
select seed_q('PHY102','Electricity','Current is measured in?',
  'Volts','Watts','Amperes','Ohms',2,'Current = Amperes.');
select seed_q('PHY102','Electricity','Electrical power in a circuit is?',
  'VI','V/I','I/V','V+I',0,'Power P = VI.');

-- PHY102 — Magnetism
select seed_q('PHY102','Magnetism','The unit of magnetic flux density is?',
  'Tesla','Weber','Henry','Farad',0,'B is measured in Tesla.', true);
select seed_q('PHY102','Magnetism','Like magnetic poles?',
  'Attract','Repel','Neutralize','Rotate',1,'Like poles repel.');
select seed_q('PHY102','Magnetism','A moving charge creates a?',
  'Gravity field','Electric field','Magnetic field','Heat wave',2,'Moving charges → magnetic field.');

-- PHY102 — Waves
select seed_q('PHY102','Waves and Optics','Speed of light in vacuum is approximately?',
  '3 × 10⁶ m/s','3 × 10⁷ m/s','3 × 10⁹ m/s','3 × 10⁸ m/s',3,'c ≈ 3 × 10⁸ m/s.', true);
select seed_q('PHY102','Waves and Optics','Frequency is measured in?',
  'Hertz','Seconds','Meters','Joules',0,'Hz = cycles per second.');
select seed_q('PHY102','Waves and Optics','Wavelength is measured from?',
  'Trough to crest','Crest to crest','Node to crest','Any two points',1,'Same point on consecutive waves.');

-- PHY102 — Thermodynamics
select seed_q('PHY102','Thermodynamics','The first law of thermodynamics is a statement of?',
  'Entropy','Heat death','Conservation of energy','Absolute zero',2,
  'ΔU = Q - W. Energy is conserved.', true);
select seed_q('PHY102','Thermodynamics','Absolute zero is?',
  '-273.15°C','-100°C','0°C','-459.67°C',0,'-273.15°C = 0 K.');

-- CHM102 — Atomic Structure
select seed_q('CHM102','Atomic Structure','The atomic number is the number of?',
  'Protons','Neutrons','Electrons','Nucleons',0,'Z = number of protons.', true);
select seed_q('CHM102','Atomic Structure','Electrons occupy?',
  'Nucleus','Rings','Orbitals','Protons',2,'Electrons in orbitals.');
select seed_q('CHM102','Atomic Structure','The nucleus contains?',
  'Electrons only','Protons and neutrons','Protons only','Neutrons only',1,'Protons + neutrons.');

-- CHM102 — Chemical Bonding
select seed_q('CHM102','Chemical Bonding','A covalent bond involves?',
  'Transfer of electrons','Loss of neutrons','Sharing of electrons','Gain of protons',2,
  'Covalent = shared electrons.', true);
select seed_q('CHM102','Chemical Bonding','An ionic bond typically forms between?',
  'Metal and non-metal','Two metals','Two non-metals','Two noble gases',0,'Metal donates, non-metal accepts.');
select seed_q('CHM102','Chemical Bonding','Water is an example of a?',
  'Non-polar molecule','Ionic compound','Metallic bond','Polar molecule',3,'H₂O has polar O-H bonds.');

-- CHM102 — Organic Chemistry
select seed_q('CHM102','Organic Chemistry','The simplest alkane is?',
  'Ethane','Methane','Propane','Butane',1,'CH₄ = methane.', true);
select seed_q('CHM102','Organic Chemistry','Alkanes have the general formula?',
  'CnH2n+2','CnH2n','CnH2n-2','CnHn',0,'Saturated hydrocarbons.');
select seed_q('CHM102','Organic Chemistry','The functional group in ethanol is?',
  'Aldehyde','Ketone','Hydroxyl','Carboxyl',2,'-OH = hydroxyl.');

-- CHM102 — Electrochemistry
select seed_q('CHM102','Electrochemistry','Oxidation involves?',
  'Loss of electrons','Gain of electrons','Gain of protons','Loss of neutrons',0,
  'OIL RIG: Oxidation Is Loss.', true);
select seed_q('CHM102','Electrochemistry','A reducing agent?',
  'Gains electrons','Loses electrons','Gains protons','Loses protons',1,'Reducing agent is oxidized.');

-- BIO102 — Cell Biology
select seed_q('BIO102','Cell Biology','The powerhouse of the cell is the?',
  'Nucleus','Ribosome','Mitochondria','Chloroplast',2,'Mitochondria produce ATP.', true);
select seed_q('BIO102','Cell Biology','Photosynthesis occurs in the?',
  'Chloroplast','Mitochondria','Nucleus','Vacuole',0,'Chloroplasts contain chlorophyll.');
select seed_q('BIO102','Cell Biology','The cell membrane is?',
  'Rigid','Selectively permeable','Impermeable','Metallic',1,'Selective permeability.');

-- BIO102 — Genetics
select seed_q('BIO102','Genetics','DNA stands for?',
  'Dinucleic acid','Deoxyribose nucleic acid','Deoxyribonucleic acid','Diribonucleic acid',2,
  'Deoxyribonucleic acid.', true);
select seed_q('BIO102','Genetics','The basic unit of heredity is the?',
  'Gene','Chromosome','Protein','Cell',0,'Genes carry traits.');
select seed_q('BIO102','Genetics','Humans have how many pairs of chromosomes?',
  '21','22','23','24',2,'46 chromosomes total.');

-- BIO102 — Ecology
select seed_q('BIO102','Ecology','Producers in an ecosystem are?',
  'Plants','Animals','Fungi','Bacteria',0,'Plants photosynthesize.', true);
select seed_q('BIO102','Ecology','A food chain starts with?',
  'Predators','Producers','Decomposers','Herbivores',1,'Energy enters through producers.');

-- COS102 — Algorithms
select seed_q('COS102','Algorithms','Time complexity of binary search is?',
  'O(n)','O(n²)','O(n log n)','O(log n)',3,'Halves search space each step.', true);
select seed_q('COS102','Algorithms','A stack uses which order?',
  'FIFO','LIFO','Random','Priority',1,'Last In, First Out.');
select seed_q('COS102','Algorithms','A queue uses which order?',
  'LIFO','FIFO','Random','Priority',1,'First In, First Out.');

-- COS102 — Programming Basics
select seed_q('COS102','Programming Basics','Which is NOT a programming language?',
  'Python','Java','HTML','C++',2,'HTML is a markup language.', true);
select seed_q('COS102','Programming Basics','A loop that never ends is called?',
  'Recursive','Infinite','Null','Async',1,'Infinite loop.');
select seed_q('COS102','Programming Basics','Variable names cannot usually start with?',
  'A number','A letter','An underscore','A dollar sign',0,'Identifiers start with letter or _.');

-- COS102 — Number Systems
select seed_q('COS102','Number Systems','Binary 1010 in decimal is?',
  '8','9','10','11',2,'1·8 + 0·4 + 1·2 + 0·1 = 10.', true);
select seed_q('COS102','Number Systems','Hexadecimal F in decimal is?',
  '11','13','15','16',2,'F = 15.');
select seed_q('COS102','Number Systems','The base of hexadecimal is?',
  '2','8','10','16',3,'Hex is base 16.');

-- STA102 — Descriptive Statistics
select seed_q('STA102','Descriptive Statistics','The mean of 2, 4, 6, 8 is?',
  '4','4.5','5','5.5',2,'(2+4+6+8)/4 = 5.', true);
select seed_q('STA102','Descriptive Statistics','The median of 1, 3, 5, 7, 9 is?',
  '5','4','6','3',0,'Middle value of sorted list.');
select seed_q('STA102','Descriptive Statistics','The mode is?',
  'The average','The most frequent value','The middle value','The range',1,'Mode = most frequent.');

-- STA102 — Probability
select seed_q('STA102','Probability','The probability of a certain event is?',
  '1','0','0.5','∞',0,'Certainty = 1.', true);
select seed_q('STA102','Probability','Two events A and B are independent when?',
  'P(A∪B) = P(A)+P(B)','P(A∩B) = 0','P(A∩B) = P(A)P(B)','P(A) = P(B)',2,
  'Independence: P(A∩B) = P(A)P(B).');
select seed_q('STA102','Probability','Probability of rolling a 3 on a fair die is?',
  '1/3','1/6','1/2','1/4',1,'Six equally likely outcomes.');

-- STA102 — Distributions
select seed_q('STA102','Distributions','The normal distribution is?',
  'Skewed','Uniform','Bimodal','Symmetric and bell-shaped',3,
  'Classic bell curve.', true);
select seed_q('STA102','Distributions','The binomial distribution models?',
  'Number of successes in n trials','Time between events','Random walks','Uniform outcomes',0,
  'n independent Bernoulli trials.');

-- ------------------------------------------------------------
-- 7. TOKENS
-- ------------------------------------------------------------
insert into tokens (token_code, is_used, price_naira, created_at) values
  ('ACAD-SEED-0001', false, 2000, now() - interval '25 days'),
  ('ACAD-SEED-0002', false, 2000, now() - interval '25 days'),
  ('ACAD-SEED-0003', false, 2000, now() - interval '20 days'),
  ('ACAD-SEED-0004', false, 2000, now() - interval '20 days'),
  ('ACAD-SEED-0005', false, 2000, now() - interval '15 days'),
  ('ACAD-SEED-0006', false, 2000, now() - interval '15 days'),
  ('ACAD-SEED-0007', false, 2000, now() - interval '10 days'),
  ('ACAD-SEED-0008', false, 2000, now() - interval '10 days'),
  ('ACAD-SEED-0009', false, 2000, now() - interval '5 days'),
  ('ACAD-SEED-0010', false, 2000, now() - interval '5 days');

-- ------------------------------------------------------------
-- 8. TEST STUDENTS
-- ------------------------------------------------------------
do $$
declare
  v_students uuid[];
  v_uid uuid;
  v_course record;
  v_attempt_count int;
begin
  -- Create 12 test students
  v_students := array[
    seed_test_student('ada.okafor@seed.test','ada.o','Ada Okafor','240801001','Computer Science','Year 1',true),
    seed_test_student('tunde.b@seed.test','tunde.b','Tunde Bakare','240801002','Computer Science','Year 1',true),
    seed_test_student('chioma.n@seed.test','chioma.n','Chioma Nwosu','240801003','Mechanical Engineering','Year 1',true),
    seed_test_student('emeka.e@seed.test','emeka.e','Emeka Eze','240801004','Electrical Engineering','Year 1',true),
    seed_test_student('fatima.a@seed.test','fatima.a','Fatima Ahmed','240801005','Medicine','Year 1',true),
    seed_test_student('kunle.a@seed.test','kunle.a','Kunle Adeyemi','240801006','Civil Engineering','Year 1',false),
    seed_test_student('zainab.i@seed.test','zainab.i','Zainab Ibrahim','240801007','Pharmacy','Year 1',false),
    seed_test_student('segun.o@seed.test','segun.o','Segun Oladipo','240801008','Physics','Year 1',false),
    seed_test_student('ngozi.u@seed.test','ngozi.u','Ngozi Uche','240801009','Biochemistry','Year 1',false),
    seed_test_student('ibrahim.s@seed.test','ibrahim.s','Ibrahim Sanusi','240801010','Mathematics','Year 1',true),
    seed_test_student('yemi.t@seed.test','yemi.t','Yemi Taiwo','240801011','Computer Science','Year 1',false),
    seed_test_student('blessing.o@seed.test','blessing.o','Blessing Okoro','240801012','Microbiology','Year 1',false)
  ];

  -- Assign a mix of used and unused tokens
  for i in 1..8 loop
    update tokens
    set is_used = true, used_by = v_students[i], used_at = now() - (random() * interval '20 days')
    where token_code = 'ACAD-SEED-' || lpad(i::text, 4, '0');
  end loop;

  -- Generate exam attempts
  for v_uid in select unnest(v_students) loop
    v_attempt_count := 1 + floor(random() * 4)::int;
    for i in 1..v_attempt_count loop
      select id into v_course from courses order by random() limit 1;
      perform seed_random_attempt(v_uid, v_course.id);
    end loop;
  end loop;
end $$;

-- ------------------------------------------------------------
-- 9. VERIFY
-- ------------------------------------------------------------
select 'courses' as table_name, count(*) as rows from courses
union all select 'topics', count(*) from topics
union all select 'questions', count(*) from questions
union all select 'questions (published)', count(*) from questions where status = 'published'
union all select 'questions (free)', count(*) from questions where is_free
union all select 'tokens', count(*) from tokens
union all select 'tokens (used)', count(*) from tokens where is_used
union all select 'students', count(*) from profiles where role = 'student'
union all select 'attempts', count(*) from exam_attempts
union all select 'answers', count(*) from exam_answers;

commit;