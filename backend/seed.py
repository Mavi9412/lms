import os
import sys
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select, SQLModel

# Add backend directory to path if running from root
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from database import engine
from models import (
    User, Role, Department, Program, Semester, Batch, Course, Section,
    Enrollment, CourseMaterial, Lesson, Assignment, Submission,
    Attendance, AttendanceStatus, Quiz, Question, QuestionType, QuizAttempt, Answer,
    Announcement
)
from auth import get_password_hash

def utc_now():
    return datetime.now(timezone.utc)

def ensure_sqlite_columns():
    try:
        with engine.begin() as conn:
            cursor = conn.exec_driver_sql("PRAGMA table_info(user)")
            user_cols = [row[1] for row in cursor.fetchall()]
            if user_cols and "program_id" not in user_cols:
                conn.exec_driver_sql("ALTER TABLE user ADD COLUMN program_id INTEGER")
            if user_cols and "batch_id" not in user_cols:
                conn.exec_driver_sql("ALTER TABLE user ADD COLUMN batch_id INTEGER")
            
            cursor = conn.exec_driver_sql("PRAGMA table_info(course)")
            course_cols = [row[1] for row in cursor.fetchall()]
            if course_cols and "is_approved" not in course_cols:
                conn.exec_driver_sql("ALTER TABLE course ADD COLUMN is_approved BOOLEAN DEFAULT 1")
            if course_cols and "is_published" not in course_cols:
                conn.exec_driver_sql("ALTER TABLE course ADD COLUMN is_published BOOLEAN DEFAULT 1")

            cursor = conn.exec_driver_sql("PRAGMA table_info(submission)")
            sub_cols = [row[1] for row in cursor.fetchall()]
            if sub_cols and "file_path" not in sub_cols:
                conn.exec_driver_sql("ALTER TABLE submission ADD COLUMN file_path VARCHAR")
    except Exception as e:
        pass

def seed_complete_university():
    print("=" * 75)
    print("      COLLEGE LMS - COMPREHENSIVE UNIVERSITY SEED SCRIPT")
    print("=" * 75)
    print("[*] Creating database tables if they do not exist...")
    SQLModel.metadata.create_all(engine)
    ensure_sqlite_columns()

    with Session(engine) as session:
        # -------------------------------------------------------------
        # 1. DEPARTMENTS
        # -------------------------------------------------------------
        print("\n[1/10] Seeding Departments...")
        depts_data = [
            ("Computer Science", "CS"),
            ("Electrical Engineering", "EE")
        ]
        dept_map = {}
        for name, code in depts_data:
            dept = session.exec(select(Department).where(Department.code == code)).first()
            if not dept:
                dept = Department(name=name, code=code)
                session.add(dept)
                session.commit()
                session.refresh(dept)
                print(f"  + Created Department: {name} ({code})")
            else:
                print(f"  * Existing Department: {name} ({code})")
            dept_map[code] = dept

        # -------------------------------------------------------------
        # 2. PROGRAMS
        # -------------------------------------------------------------
        print("\n[2/10] Seeding Programs...")
        progs_data = [
            ("Bachelor of Science in Computer Science", "BSCS", dept_map["CS"].id),
            ("Bachelor of Science in Electrical Engineering", "BSEE", dept_map["EE"].id)
        ]
        prog_map = {}
        for name, code, dept_id in progs_data:
            prog = session.exec(select(Program).where(Program.code == code)).first()
            if not prog:
                prog = Program(name=name, code=code, department_id=dept_id)
                session.add(prog)
                session.commit()
                session.refresh(prog)
                print(f"  + Created Program: {name} ({code})")
            else:
                print(f"  * Existing Program: {name} ({code})")
            prog_map[code] = prog

        # -------------------------------------------------------------
        # 3. SEMESTERS & BATCHES
        # -------------------------------------------------------------
        print("\n[3/10] Seeding Semesters & Batches...")
        semesters_data = [
            ("Fall 2026", True),
            ("Spring 2027", False)
        ]
        sem_map = {}
        for name, is_active in semesters_data:
            sem = session.exec(select(Semester).where(Semester.name == name)).first()
            if not sem:
                sem = Semester(name=name, is_active=is_active)
                session.add(sem)
                session.commit()
                session.refresh(sem)
                print(f"  + Created Semester: {name} (Active: {is_active})")
            else:
                print(f"  * Existing Semester: {name}")
            sem_map[name] = sem

        active_semester = sem_map["Fall 2026"]

        batches_data = [
            ("Batch 2026-CS", prog_map["BSCS"].id),
            ("Batch 2026-EE", prog_map["BSEE"].id)
        ]
        batch_map = {}
        for name, prog_id in batches_data:
            batch = session.exec(select(Batch).where(Batch.name == name)).first()
            if not batch:
                batch = Batch(
                    name=name,
                    program_id=prog_id,
                    start_date=utc_now() - timedelta(days=60),
                    is_active=True
                )
                session.add(batch)
                session.commit()
                session.refresh(batch)
                print(f"  + Created Batch: {name}")
            else:
                print(f"  * Existing Batch: {name}")
            batch_map[name] = batch

        # -------------------------------------------------------------
        # 4. USERS (ADMIN, TEACHERS, STUDENTS)
        # -------------------------------------------------------------
        print("\n[4/10] Seeding Users...")
        users_data = [
            # Admins
            ("admin@lms.com", "System Administrator", "admin123", Role.admin, None, None),
            # Default Teacher
            ("teacher@lms.com", "Dr. Sarah Jenkins", "teacher123", Role.teacher, None, None),
            # Extra Teachers
            ("prof.tariq@lms.com", "Prof. Tariq Mahmood", "password123", Role.teacher, prog_map["BSCS"].id, None),
            ("dr.ayesha@lms.com", "Dr. Ayesha Malik", "password123", Role.teacher, prog_map["BSEE"].id, None),
            ("dr.bilal@lms.com", "Dr. Bilal Khan", "password123", Role.teacher, prog_map["BSCS"].id, None),
            # Default Student
            ("student@lms.com", "John Doe", "student123", Role.student, prog_map["BSCS"].id, batch_map["Batch 2026-CS"].id),
            # Extra Students
            ("ali.ahmed@lms.com", "Ali Ahmed", "password123", Role.student, prog_map["BSCS"].id, batch_map["Batch 2026-CS"].id),
            ("sara.khan@lms.com", "Sara Khan", "password123", Role.student, prog_map["BSCS"].id, batch_map["Batch 2026-CS"].id),
            ("usman.raza@lms.com", "Usman Raza", "password123", Role.student, prog_map["BSEE"].id, batch_map["Batch 2026-EE"].id),
            ("fatima.noor@lms.com", "Fatima Noor", "password123", Role.student, prog_map["BSEE"].id, batch_map["Batch 2026-EE"].id)
        ]

        user_map = {}
        for email, name, pwd, role, prog_id, batch_id in users_data:
            user = session.exec(select(User).where(User.email == email)).first()
            if not user:
                user = User(
                    email=email,
                    full_name=name,
                    role=role,
                    hashed_password=get_password_hash(pwd),
                    program_id=prog_id,
                    batch_id=batch_id,
                    is_active=True
                )
                session.add(user)
                session.commit()
                session.refresh(user)
                print(f"  + Created User: {name} ({role}) -> {email}")
            else:
                user.hashed_password = get_password_hash(pwd)
                user.is_active = True
                user.full_name = name
                session.add(user)
                session.commit()
                session.refresh(user)
                print(f"  * Existing User: {name} ({role}) -> {email}")
            user_map[email] = user

        # -------------------------------------------------------------
        # 5. COURSES & ALLOCATIONS (SECTIONS)
        # -------------------------------------------------------------
        print("\n[5/10] Seeding Courses & Sections...")
        courses_data = [
            ("CS-202", "Database Systems", 3, dept_map["CS"].id, "teacher@lms.com", "Relational database concepts, SQL queries, normalization, and indexing."),
            ("CS-301", "Data Structures & Algorithms", 3, dept_map["CS"].id, "prof.tariq@lms.com", "Core DSA covering Balanced Trees, Graphs, Sorting algorithms and Dynamic Programming."),
            ("CS-305", "Computer Networks", 3, dept_map["CS"].id, "dr.bilal@lms.com", "Data communications, TCP/IP stack, socket programming, routing and DNS protocols."),
            ("EE-201", "Electric Circuit Analysis", 4, dept_map["EE"].id, "dr.ayesha@lms.com", "DC/AC circuit theorems, nodal & mesh analysis, transient response and RLC circuits."),
            ("EE-302", "Signals & Systems", 3, dept_map["EE"].id, "dr.ayesha@lms.com", "Continuous and discrete-time signals, Fourier transforms, Laplace and z-domain analysis.")
        ]

        course_map = {}
        section_map = {}
        for code, title, credits, dept_id, teacher_email, desc in courses_data:
            course = session.exec(select(Course).where(Course.code == code)).first()
            if not course:
                course = Course(
                    title=title,
                    code=code,
                    credit_hours=credits,
                    department_id=dept_id,
                    description=desc,
                    is_approved=True,
                    is_published=True
                )
                session.add(course)
                session.commit()
                session.refresh(course)
                print(f"  + Created Course: {code} - {title}")
            else:
                course.is_approved = True
                course.is_published = True
                session.add(course)
                session.commit()
                session.refresh(course)
                print(f"  * Existing Course: {code} - {title}")
            course_map[code] = course

            # Ensure Section A and allocate to teacher
            teacher = user_map[teacher_email]
            sec = session.exec(select(Section).where(Section.course_id == course.id).where(Section.name == "Section A")).first()
            if not sec:
                sec = Section(
                    name="Section A",
                    course_id=course.id,
                    semester_id=active_semester.id,
                    teacher_id=teacher.id,
                    schedule="Mon/Wed 10:00 - 11:30 AM"
                )
                session.add(sec)
                session.commit()
                session.refresh(sec)
                print(f"    -> Allocated Section A to {teacher.full_name}")
            else:
                sec.teacher_id = teacher.id
                sec.semester_id = active_semester.id
                session.add(sec)
                session.commit()
                session.refresh(sec)
                print(f"    -> Re-allocated Section A to {teacher.full_name}")
            section_map[code] = sec

        # -------------------------------------------------------------
        # 6. ENROLLMENTS
        # -------------------------------------------------------------
        print("\n[6/10] Seeding Student Enrollments...")
        enrollments_data = [
            ("student@lms.com", "CS-202"),
            ("ali.ahmed@lms.com", "CS-301"),
            ("ali.ahmed@lms.com", "CS-305"),
            ("sara.khan@lms.com", "CS-301"),
            ("sara.khan@lms.com", "CS-305"),
            ("usman.raza@lms.com", "EE-201"),
            ("usman.raza@lms.com", "EE-302"),
            ("fatima.noor@lms.com", "EE-201"),
            ("fatima.noor@lms.com", "EE-302")
        ]

        for student_email, course_code in enrollments_data:
            student = user_map[student_email]
            sec = section_map[course_code]
            enr = session.exec(
                select(Enrollment)
                .where(Enrollment.student_id == student.id)
                .where(Enrollment.section_id == sec.id)
            ).first()
            if not enr:
                enr = Enrollment(student_id=student.id, section_id=sec.id)
                session.add(enr)
                session.commit()
                print(f"  + Enrolled {student.full_name} in {course_code}")
            else:
                print(f"  * {student.full_name} already enrolled in {course_code}")

        # -------------------------------------------------------------
        # 7. COURSE MATERIALS & LESSONS
        # -------------------------------------------------------------
        print("\n[7/10] Seeding Materials & Lessons...")
        uploads_dir = os.path.join(current_dir, "uploads")
        os.makedirs(uploads_dir, exist_ok=True)

        materials_to_create = [
            ("CS-202", "Database Systems Lecture 01 - Relational Model & SQL.pdf"),
            ("CS-301", "CS301 Lecture 01 - Binary Trees and AVL Balancing.pdf"),
            ("CS-305", "CS305 Lecture 01 - OSI Reference Model & IP Addressing.pdf"),
            ("EE-201", "EE201 Lab Manual 01 - Kirchhoff Laws & Nodal Analysis.pdf"),
            ("EE-302", "EE302 Lecture 01 - Continuous vs Discrete Signals.pdf")
        ]

        for code, filename in materials_to_create:
            cid = course_map[code].id
            mat = session.exec(select(CourseMaterial).where(CourseMaterial.course_id == cid).where(CourseMaterial.title == filename)).first()
            if not mat:
                # Ensure dummy physical file exists
                file_rel = f"uploads/{cid}_{int(utc_now().timestamp())}_{filename.replace(' ', '_')}"
                file_abs = os.path.join(current_dir, file_rel.replace('/', os.sep))
                with open(file_abs, "wb") as f:
                    f.write(b"%PDF-1.4 LMS College Project Mock Lecture PDF Sample")
                
                mat = CourseMaterial(title=filename, file_path=file_rel, course_id=cid)
                session.add(mat)
                session.commit()
                print(f"  + Added Material to {code}: {filename}")

        # Clear old/duplicate lessons for seeded courses so curriculum stays clean and ordered
        for code in course_map:
            cid = course_map[code].id
            old_lessons = session.exec(select(Lesson).where(Lesson.course_id == cid)).all()
            for ol in old_lessons:
                session.delete(ol)
        session.commit()

        lessons_to_create = [
            # CS-202 Database Systems (5 Modules)
            ("CS-202", "Module 1: Relational Model Foundations & Codd's Rules", "Study Edgar Codd's foundational 12 rules, entity integrity, referential integrity, and relational algebra operations (Selection, Projection, Join).", 1),
            ("CS-202", "Module 2: Entity-Relationship (ER) & Schema Design", "Translating real-world domain requirements into formal ER diagrams with cardinalities, weak entities, and converting them into normalized relational tables.", 2),
            ("CS-202", "Module 3: Normalization Techniques (1NF, 2NF, 3NF, BCNF)", "Systematic functional dependency analysis and table decomposition to eliminate insertion, deletion, and update anomalies.", 3),
            ("CS-202", "Module 4: SQL Query Mastery & Relational Joins", "Writing high-performance queries using INNER, LEFT, RIGHT, FULL OUTER joins, aggregate functions, GROUP BY, HAVING clauses, and subqueries.", 4),
            ("CS-202", "Module 5: Transactions, ACID Properties & Concurrency Control", "Deep dive into Atomicity, Consistency, Isolation, and Durability, write-ahead logging (WAL), and 2-Phase Locking (2PL) protocols.", 5),

            # CS-301 Data Structures & Algorithms (5 Modules)
            ("CS-301", "Module 1: Tree Terminology & Binary Tree Traversals", "Hierarchical data representation, depth vs. height, and recursive implementations of Pre-order, In-order, and Post-order traversals.", 1),
            ("CS-301", "Module 2: Binary Search Trees (BST) & Search Complexity", "Properties of BST (left < root <= right), searching, insertion, and deletion algorithms, analyzing average O(log n) vs worst-case O(n) complexity.", 2),
            ("CS-301", "Module 3: Self-Balancing Trees: AVL Rotations & Rebalancing", "Deep dive into Balance Factors (-1, 0, +1), and restoring invariant height balance through Single (LL, RR) and Double (LR, RL) rotations.", 3),
            ("CS-301", "Module 4: Binary Heaps & Priority Queue Implementations", "Max-Heap and Min-Heap array representations, Percolate-Up, Percolate-Down operations, and O(n log n) Heap Sort.", 4),
            ("CS-301", "Module 5: Graph Theory & Traversal Algorithms (BFS / DFS)", "Graph representation using Adjacency Lists and Matrices; Breadth-First Search (Queue) and Depth-First Search (Stack) implementations.", 5),

            # CS-305 Computer Networks (4 Modules)
            ("CS-305", "Module 1: Network Architectures & Layered Reference Models", "Comparison of OSI 7-Layer model and TCP/IP protocol suite, packet encapsulation, and header parsing.", 1),
            ("CS-305", "Module 2: Data Link Layer, MAC Addressing & Error Detection", "Ethernet framing, cyclic redundancy checks (CRC), collision detection (CSMA/CD), and switch forwarding tables.", 2),
            ("CS-305", "Module 3: IP Addressing, CIDR Subnetting & VLSM", "Hierarchical IP routing, Classless Inter-Domain Routing notation, variable length subnet masking, and gateway routing.", 3),
            ("CS-305", "Module 4: Transport Protocols: TCP 3-Way Handshake vs UDP", "Reliable transmission, sequence numbering, acknowledgment packets, window flow control, and UDP streaming.", 4),

            # EE-201 Electric Circuit Analysis (4 Modules)
            ("EE-201", "Module 1: Fundamental Circuit Laws (Ohm's, KCL, KVL)", "Charge, current, voltage, Kirchhoff's Current Law at nodes, and Kirchhoff's Voltage Law around closed loops.", 1),
            ("EE-201", "Module 2: Systematic Nodal & Mesh Analysis", "Formulating matrix nodal equations for circuits with independent and dependent sources using Gaussian elimination.", 2),
            ("EE-201", "Module 3: Network Theorems (Thevenin & Norton Equivalents)", "Simplifying complex linear two-terminal networks to equivalent voltage/current sources and maximum power transfer theorem.", 3),
            ("EE-201", "Module 4: Transient Response of First-Order RC & RL Circuits", "Differential equations governing charging and discharging phases with time constants tau = RC and tau = L/R.", 4),

            # EE-302 Signals and Systems (4 Modules)
            ("EE-302", "Module 1: Continuous-Time & Discrete-Time Signal Properties", "Classification of signals: even/odd, periodic/aperiodic, energy/power, and transformations of independent variables.", 1),
            ("EE-302", "Module 2: Linear Time-Invariant (LTI) Systems & Convolution", "Impulse response characterization, causality, stability, and evaluation of continuous and discrete convolution integrals.", 2),
            ("EE-302", "Module 3: Fourier Series Representation of Periodic Signals", "Trigonometric and exponential Fourier series, harmonic spectrum, and frequency response analysis.", 3),
            ("EE-302", "Module 4: Continuous-Time Fourier Transform (CTFT)", "Spectral analysis of non-periodic signals, properties of duality, modulation, and ideal filter frequency responses.", 4)
        ]

        for code, l_title, l_content, order in lessons_to_create:
            cid = course_map[code].id
            lesson = Lesson(title=l_title, content=l_content, order=order, course_id=cid)
            session.add(lesson)
        session.commit()
        print(f"  + Seeded {len(lessons_to_create)} structured curriculum modules across all courses.")

        # -------------------------------------------------------------
        # 8. ASSIGNMENTS, SUBMISSIONS & GRADING
        # -------------------------------------------------------------
        print("\n[8/10] Seeding Assignments, Submissions & Grades...")
        assignments_data = [
            ("CS-202", "Assignment 1: ERD Design & Schema Normalization", "Design a complete normalized schema for a university booking system.", 100, "student@lms.com", "Submitted full ERD diagram and 3NF SQL schemas.", 98.0, "Flawless BCNF decomposition and clear ER diagram."),
            ("CS-301", "Assignment 1: AVL Tree Insertion & Rotations", "Implement AVL Tree balancing with unit test cases in C++/Python.", 100, "ali.ahmed@lms.com", "Implemented AVL tree with single (LL, RR) and double (LR, RL) rotations. GitHub: github.com/ali/avl", 96.0, "Outstanding AVL balancing logic and detailed unit tests."),
            ("CS-305", "Assignment 1: Subnetting & Routing Table Design", "Design Classless Inter-Domain Routing (CIDR) subnets for a 500-host campus network.", 100, "sara.khan@lms.com", "Submitted VLSM subnet allocations and Cisco routing table commands.", 92.0, "Accurate subnet masks and routing hops."),
            ("EE-201", "Lab Report 1: Nodal Analysis Multisim Simulation", "Derive nodal equations for bridge circuit and verify via Multisim oscilloscope.", 50, "usman.raza@lms.com", "Nodal voltages calculated: V1=12V, V2=4.8V. Multisim schematics and graphs attached.", 49.0, "Precise calculations and clean schematic diagram."),
            ("EE-302", "Assignment 1: Fourier Series Coefficient Computation", "Compute trigonometric and exponential Fourier coefficients for a periodic square wave.", 50, "fatima.noor@lms.com", "Derived exponential Fourier coefficients and plotted spectrum harmonics in MATLAB.", 47.0, "Well-derived harmonic coefficients and neat plots.")
        ]

        for code, title, desc, max_pts, student_email, sub_content, grade_val, feedback in assignments_data:
            cid = course_map[code].id
            asgn = session.exec(select(Assignment).where(Assignment.course_id == cid).where(Assignment.title == title)).first()
            if not asgn:
                asgn = Assignment(
                    title=title,
                    description=desc,
                    max_points=max_pts,
                    due_date=utc_now() + timedelta(days=20),
                    course_id=cid
                )
                session.add(asgn)
                session.commit()
                session.refresh(asgn)
                print(f"  + Created Assignment for {code}: {title}")

            student = user_map[student_email]
            sub = session.exec(select(Submission).where(Submission.assignment_id == asgn.id).where(Submission.student_id == student.id)).first()
            if not sub:
                sub = Submission(
                    assignment_id=asgn.id,
                    student_id=student.id,
                    content=sub_content,
                    submitted_at=utc_now() - timedelta(days=1),
                    grade=grade_val,
                    feedback=feedback
                )
                session.add(sub)
                session.commit()
                print(f"    -> Graded {student.full_name}: {grade_val}/{max_pts} ({feedback})")

        # -------------------------------------------------------------
        # 9. ATTENDANCE RECORDS
        # -------------------------------------------------------------
        print("\n[9/10] Seeding Attendance Records...")
        today = utc_now().replace(hour=0, minute=0, second=0, microsecond=0)
        attendance_entries = [
            ("CS-202", "student@lms.com", AttendanceStatus.present, "teacher@lms.com"),
            ("CS-301", "ali.ahmed@lms.com", AttendanceStatus.present, "prof.tariq@lms.com"),
            ("CS-301", "sara.khan@lms.com", AttendanceStatus.present, "prof.tariq@lms.com"),
            ("CS-305", "ali.ahmed@lms.com", AttendanceStatus.present, "dr.bilal@lms.com"),
            ("CS-305", "sara.khan@lms.com", AttendanceStatus.present, "dr.bilal@lms.com"),
            ("EE-201", "usman.raza@lms.com", AttendanceStatus.present, "dr.ayesha@lms.com"),
            ("EE-201", "fatima.noor@lms.com", AttendanceStatus.present, "dr.ayesha@lms.com"),
            ("EE-302", "usman.raza@lms.com", AttendanceStatus.present, "dr.ayesha@lms.com"),
            ("EE-302", "fatima.noor@lms.com", AttendanceStatus.present, "dr.ayesha@lms.com")
        ]

        for code, s_email, status_val, t_email in attendance_entries:
            sec = section_map[code]
            student = user_map[s_email]
            teacher = user_map[t_email]
            att = session.exec(
                select(Attendance)
                .where(Attendance.section_id == sec.id)
                .where(Attendance.student_id == student.id)
                .where(Attendance.date == today)
            ).first()
            if not att:
                att = Attendance(
                    section_id=sec.id,
                    student_id=student.id,
                    date=today,
                    status=status_val,
                    marked_by=teacher.id
                )
                session.add(att)
                session.commit()
                print(f"  + Marked Attendance for {student.full_name} in {code} ({status_val})")

        # -------------------------------------------------------------
        # 10. QUIZZES & AUTO-GRADED ATTEMPTS
        # -------------------------------------------------------------
        print("\n[10/10] Seeding Quizzes & Scored Attempts...")
        quizzes_data = [
            ("CS-301", "prof.tariq@lms.com", "DSA Quiz 1: Tree Height & Big-O", [
                ("mcq", "What is the worst-case search complexity in an unbalanced BST?", 5, '["O(1)", "O(log n)", "O(n)", "O(n log n)"]', "O(n)", "ali.ahmed@lms.com"),
                ("true_false", "In an AVL tree, the balance factor of every node must be -1, 0, or 1.", 5, '["true", "false"]', "true", "ali.ahmed@lms.com")
            ]),
            ("CS-202", "teacher@lms.com", "Database Quiz 1: Relational Keys & SQL Joins", [
                ("mcq", "Which normal form removes transitive dependencies?", 5, '["1NF", "2NF", "3NF", "BCNF"]', "3NF", "student@lms.com"),
                ("true_false", "A foreign key in a relational table can accept NULL values.", 5, '["true", "false"]', "true", "student@lms.com")
            ])
        ]

        for code, t_email, q_title, q_questions in quizzes_data:
            cid = course_map[code].id
            teacher = user_map[t_email]
            quiz = session.exec(select(Quiz).where(Quiz.course_id == cid).where(Quiz.title == q_title)).first()
            if not quiz:
                quiz = Quiz(
                    course_id=cid,
                    title=q_title,
                    description="Standard academic assessment for mid-term evaluation.",
                    time_limit=15,
                    max_attempts=2,
                    passing_score=60,
                    created_by=teacher.id
                )
                session.add(quiz)
                session.commit()
                session.refresh(quiz)

                question_objs = []
                for q_type, q_text, pts, opts, correct_ans, _ in q_questions:
                    q = Question(
                        quiz_id=quiz.id,
                        question_type=q_type,
                        question_text=q_text,
                        points=pts,
                        options=opts,
                        correct_answer=correct_ans
                    )
                    session.add(q)
                    question_objs.append(q)
                session.commit()
                print(f"  + Created Quiz in {code}: {q_title}")

                # Student Attempt & Auto-Grading (100% score)
                test_student_email = q_questions[0][5]
                st = user_map[test_student_email]
                attempt = QuizAttempt(
                    quiz_id=quiz.id,
                    student_id=st.id,
                    attempt_number=1,
                    started_at=utc_now() - timedelta(minutes=15),
                    submitted_at=utc_now(),
                    score=10.0,
                    max_score=10.0,
                    percentage=100.0
                )
                session.add(attempt)
                session.commit()
                session.refresh(attempt)

                for q in question_objs:
                    ans = Answer(
                        attempt_id=attempt.id,
                        question_id=q.id,
                        answer_text=q.correct_answer,
                        is_correct=True,
                        points_earned=q.points
                    )
                    session.add(ans)
                session.commit()
                print(f"    -> Auto-Graded Attempt for {st.full_name}: 10.0/10.0 (100%)")

        # -------------------------------------------------------------
        # 11. ANNOUNCEMENTS
        # -------------------------------------------------------------
        announcements_data = [
            ("CS-202", "teacher@lms.com", "Welcome to Database Systems Fall 2026", "Welcome to CS-202! Please download the lecture slides and review the ERD assignment due in 3 weeks."),
            ("CS-301", "prof.tariq@lms.com", "DSA Assignment 1 & Quiz 1 Live", "AVL tree programming assignment and Big-O quiz have been published. Check deadlines in your dashboard."),
            ("EE-201", "dr.ayesha@lms.com", "Circuits Lab 01 Schedule", "Please bring the printed Lab Manual to the Electrical Circuits lab this Thursday.")
        ]
        for code, t_email, a_title, a_content in announcements_data:
            cid = course_map[code].id
            teacher = user_map[t_email]
            ann = session.exec(select(Announcement).where(Announcement.course_id == cid).where(Announcement.title == a_title)).first()
            if not ann:
                ann = Announcement(
                    course_id=cid,
                    title=a_title,
                    content=a_content,
                    created_by=teacher.id,
                    is_pinned=True
                )
                session.add(ann)
                session.commit()
                print(f"  + Created Announcement in {code}: {a_title}")

    print("\n" + "=" * 75)
    print("  [SUCCESS] UNIVERSITY LMS SEEDING COMPLETED IN FULL!")
    print("=" * 75)
    print("  All default and multi-department test accounts are ready:")
    print("  - Admin   : admin@lms.com / admin123")
    print("  - Teacher : teacher@lms.com / teacher123 (or prof.tariq@lms.com / password123)")
    print("  - Student : student@lms.com / student123 (or ali.ahmed@lms.com / password123)")
    print("=" * 75)

if __name__ == "__main__":
    seed_complete_university()
