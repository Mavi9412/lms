from sqlmodel import Session, select, SQLModel
from database import engine
from models import Department, Program, Semester, Course, Section

def seed_academic():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        # 1. Departments
        cs_dept = session.exec(select(Department).where(Department.code == "CS")).first()
        if not cs_dept:
            print("Creating CS Department...")
            cs_dept = Department(name="Computer Science", code="CS")
            session.add(cs_dept)
            session.commit()
            session.refresh(cs_dept)

        # 2. Programs
        bscs = session.exec(select(Program).where(Program.code == "BSCS")).first()
        if not bscs:
            print("Creating BSCS Program...")
            bscs = Program(name="Bachelor of Science in Computer Science", code="BSCS", department_id=cs_dept.id)
            session.add(bscs)
            session.commit()
            session.refresh(bscs)

        # 3. Semesters
        fall2026 = session.exec(select(Semester).where(Semester.name == "Fall 2026")).first()
        if not fall2026:
            print("Creating Fall 2026 Semester...")
            fall2026 = Semester(name="Fall 2026", is_active=True)
            session.add(fall2026)
            session.commit()
            session.refresh(fall2026)

        # 4. Courses
        courses_data = [
            {"title": "Introduction to Programming", "code": "CS-101", "credit_hours": 3},
            {"title": "Data Structures", "code": "CS-201", "credit_hours": 4},
        ]
        
        for c_data in courses_data:
            course = session.exec(select(Course).where(Course.code == c_data["code"])).first()
            if not course:
                print(f"Creating Course {c_data['code']}...")
                course = Course(
                    title=c_data["title"], 
                    code=c_data["code"], 
                    credit_hours=c_data["credit_hours"],
                    department_id=cs_dept.id
                )
                session.add(course)
                session.commit()
                session.refresh(course)
            
            # 5. Sections (Default Section A)
            section_name = "Section A"
            section = session.exec(select(Section).where(Section.course_id == course.id).where(Section.name == section_name)).first()
            if not section:
                print(f"Creating Section A for {course.code}...")
                section = Section( # No teacher assigned yet
                    name=section_name,
                    course_id=course.id,
                    semester_id=fall2026.id,
                    schedule="Mon/Wed 10:00 AM"
                )
                session.add(section)
                session.commit()

        print("Academic Seeding Completed!")

if __name__ == "__main__":
    seed_academic()
