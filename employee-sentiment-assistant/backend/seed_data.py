"""
Seed Script — populates the database with realistic demo data.
Run: python -m backend.seed_data
"""

import asyncio
import random
from datetime import datetime, timedelta, timezone

from backend.database.connection import AsyncSessionLocal, init_db
from backend.models.models import User, Feedback, SentimentResult, Alert
from backend.services.auth_service import hash_password
from backend.services.ai_service import _demo_analyze

# ──────────────── Seed Configuration ────────────────────────

DEPARTMENTS = ["Engineering", "Marketing", "Sales", "HR", "Product", "Finance", "Design", "Operations"]

USERS = [
    {"name": "Alice Chen",      "email": "alice@demo.com",   "role": "admin",    "dept": "HR"},
    {"name": "Bob Martinez",    "email": "bob@demo.com",     "role": "hr",       "dept": "HR"},
    {"name": "Carol Singh",     "email": "carol@demo.com",   "role": "hr",       "dept": "HR"},
    {"name": "David Kim",       "email": "david@demo.com",   "role": "employee", "dept": "Engineering"},
    {"name": "Emma Wilson",     "email": "emma@demo.com",    "role": "employee", "dept": "Engineering"},
    {"name": "Frank Okafor",    "email": "frank@demo.com",   "role": "employee", "dept": "Marketing"},
    {"name": "Grace Liu",       "email": "grace@demo.com",   "role": "employee", "dept": "Sales"},
    {"name": "Henry Patel",     "email": "henry@demo.com",   "role": "employee", "dept": "Product"},
    {"name": "Iris Nakamura",   "email": "iris@demo.com",    "role": "employee", "dept": "Design"},
    {"name": "James O'Brien",   "email": "james@demo.com",   "role": "employee", "dept": "Finance"},
]

FEEDBACK_SAMPLES = [
    # Engineering — Mixed stress/burnout
    ("Engineering", "I've been working 70+ hour weeks for the past two months. The deadlines are impossible and management keeps piling on new features without removing anything from the backlog. I'm completely burned out and honestly thinking about leaving."),
    ("Engineering", "The new tech stack migration is exciting but the lack of documentation is really frustrating. I feel like I'm constantly reinventing the wheel and my questions go unanswered for days."),
    ("Engineering", "Our team lead is amazing and I genuinely enjoy my work. The recent architecture decision was smart and I feel like we're finally moving in the right direction. Really proud of what we shipped last sprint."),
    ("Engineering", "I appreciate the company's investment in learning resources but the workload leaves no time to actually use them. It feels performative rather than genuine support for growth."),
    ("Engineering", "The on-call rotation is destroying my work-life balance. Three incidents last week at 2am and I'm expected to be at a 9am standup the next morning. This is not sustainable."),
    ("Engineering", "Code reviews are constructive and my team genuinely helps each other grow. The collaborative culture here is unlike anywhere I've worked before."),

    # Marketing — Mostly positive
    ("Marketing", "Our new campaign pipeline is working really well! The cross-functional collaboration with design and product has been smooth. Really enjoying the creative freedom we have."),
    ("Marketing", "The recent rebranding project was stressful but seeing it launch successfully was incredibly rewarding. Great teamwork across all departments."),
    ("Marketing", "I feel my ideas are valued and my manager is very supportive. The flexible remote policy makes a huge difference to my daily life. Love working here."),
    ("Marketing", "Would love more budget transparency and better tools for attribution tracking. Right now we're flying blind on some key metrics which is frustrating."),
    ("Marketing", "The constant pivots in campaign strategy are stressful. It feels like we never have enough time to execute properly before the strategy shifts again."),

    # Sales — High pressure
    ("Sales", "Quota expectations have increased 40% this quarter with zero additional support or resources. The pressure is immense and I see colleagues breaking down. This is not okay."),
    ("Sales", "I enjoy the competitive nature of sales and my team is great but I feel the commission structure changes were unfair and nobody consulted us before implementing."),
    ("Sales", "Just had my best quarter ever and the recognition from leadership made me feel truly valued. The incentive structure works for me and I'm motivated for Q4."),
    ("Sales", "The CRM system is terrible and I waste 2 hours every day on manual data entry. My manager knows but nothing changes. Very demoralizing."),
    ("Sales", "Team culture is toxic. High performers are celebrated while everyone else is made to feel inadequate. I dread Monday mornings."),

    # HR — Neutral to positive
    ("HR", "Handling employee relations issues is rewarding but we need more headcount. Two HR partners for 800 employees is not enough and it leads to poor outcomes for everyone."),
    ("HR", "I love the people-first culture we're trying to build. The leadership team genuinely listens and acts on feedback. Proud to work here."),
    ("HR", "The new HRIS implementation was painful but necessary. Looking forward to the efficiencies it will bring. The team worked hard through the transition."),

    # Product — Mixed
    ("Product", "Stakeholder management has been particularly difficult this quarter. Everyone has different priorities and there's no single source of truth for the roadmap. Creates a lot of unnecessary conflict."),
    ("Product", "Our discovery process has really matured. I feel empowered to talk to customers and the insights directly shape what we build. This is why I love product."),
    ("Product", "The relationship between product and engineering has improved dramatically since we started doing joint planning. Shipping feels collaborative now."),
    ("Product", "I'm anxious about the upcoming reorg. The uncertainty about reporting lines and team structure is affecting my focus and motivation."),

    # Finance — Mostly neutral
    ("Finance", "Month-end close is always extremely stressful but the team pulls together well. Would benefit from more automation in our reporting workflows."),
    ("Finance", "Satisfied with my role and compensation. The work is predictable and the team is professional. Would like more visibility into strategic decisions."),

    # Design — Positive with concerns
    ("Design", "The design system project has been the highlight of my year. We're finally creating consistency across products and it feels like meaningful, impactful work."),
    ("Design", "Design is still not included early enough in the product development process. We're often handed final specs and asked to 'make it look good' which is very frustrating."),
    ("Design", "My manager champions the design team brilliantly. The investment in design tools and education shows the company takes craft seriously."),

    # Operations — Stressed
    ("Operations", "Supply chain disruptions have created a very stressful environment. The team is working incredibly hard but morale is suffering. We need clearer communication from leadership."),
    ("Operations", "Process improvements we suggested six months ago have still not been implemented. It's demoralizing to see the same inefficiencies persist while our suggestions are ignored."),
    ("Operations", "Really appreciate the recent team building events and the manager who always fights for our resources. Makes the hard days more bearable."),
]

ALERTS_SEED = [
    {
        "department":  "Engineering",
        "alert_type":  "negativity_spike",
        "message":     "Engineering department: 72% negative sentiment detected in the last 24 hours (18/25 entries). Burnout and overwork are primary themes. Immediate HR review recommended.",
        "severity":    "critical",
        "is_resolved": False,
    },
    {
        "department":  "Sales",
        "alert_type":  "negativity_spike",
        "message":     "Sales department: 65% negative sentiment detected. Key issues: toxic team culture, unfair quota changes. Manager conversation recommended.",
        "severity":    "high",
        "is_resolved": False,
    },
    {
        "department":  "Operations",
        "alert_type":  "burnout",
        "message":     "Operations team showing sustained negative sentiment over 7 days. Recurring themes: ignored suggestions, high workload. Consider team-level intervention.",
        "severity":    "medium",
        "is_resolved": False,
    },
    {
        "department":  "Marketing",
        "alert_type":  "negativity_spike",
        "message":     "Marketing: Minor negativity spike resolved after team offsite. Monitoring continues.",
        "severity":    "low",
        "is_resolved": True,
    },
]


# ──────────────── Seeder ────────────────────────────────────

async def seed():
    await init_db()

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("[Seed] Database already contains data. Skipping.")
            return

        print("[Seed] Creating users...")
        user_objects = []
        for u in USERS:
            user = User(
                email      = u["email"],
                name       = u["name"],
                password   = hash_password("demo1234"),
                role       = u["role"],
                department = u["dept"],
                company_id = 1,
                is_active  = True,
            )
            db.add(user)
            user_objects.append(user)

        await db.flush()

        print("[Seed] Creating feedback entries with AI analysis...")
        employee_users = [u for u in user_objects if u.role == "employee"]

        # Generate feedback spread over last 30 days
        for i, (dept, content) in enumerate(FEEDBACK_SAMPLES):
            days_ago  = random.randint(0, 29)
            created   = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 23))
            anon      = random.random() < 0.35  # 35% anonymous
            user_dept_match = [u for u in employee_users if u.department == dept]
            user      = random.choice(user_dept_match) if user_dept_match else random.choice(employee_users)

            fb = Feedback(
                user_id      = None if anon else user.id,
                content      = content,
                department   = dept,
                company_id   = 1,
                is_anonymous = anon,
                source       = random.choice(["form", "survey", "form", "form"]),
                created_at   = created,
            )
            db.add(fb)
            await db.flush()

            # Analyze with demo engine
            ai = _demo_analyze(content)
            sr = SentimentResult(
                feedback_id     = fb.id,
                sentiment       = ai["sentiment"],
                emotion         = ai["emotion"],
                score           = ai["score"],
                confidence      = ai["confidence"],
                summary         = ai["summary"],
                recommendation  = ai["recommendation"],
                keywords        = ai["keywords"],
                raw_ai_response = ai,
                created_at      = created,
            )
            db.add(sr)

        # Add some extra historical entries for better trend charts
        print("[Seed] Adding historical trend data...")
        for day_offset in range(30, 0, -1):
            n_entries = random.randint(2, 6)
            for _ in range(n_entries):
                dept    = random.choice(DEPARTMENTS)
                content = random.choice([c for d, c in FEEDBACK_SAMPLES if d == dept] or
                                        [c for _, c in FEEDBACK_SAMPLES])
                created = datetime.now(timezone.utc) - timedelta(days=day_offset, hours=random.randint(0, 23))
                fb = Feedback(
                    user_id      = None,
                    content      = content,
                    department   = dept,
                    company_id   = 1,
                    is_anonymous = True,
                    source       = "survey",
                    created_at   = created,
                )
                db.add(fb)
                await db.flush()
                ai = _demo_analyze(content)
                sr = SentimentResult(
                    feedback_id     = fb.id,
                    sentiment       = ai["sentiment"],
                    emotion         = ai["emotion"],
                    score           = ai["score"],
                    confidence      = ai["confidence"],
                    summary         = ai["summary"],
                    recommendation  = ai["recommendation"],
                    keywords        = ai["keywords"],
                    raw_ai_response = ai,
                    created_at      = created,
                )
                db.add(sr)

        print("[Seed] Creating alerts...")
        for a in ALERTS_SEED:
            alert = Alert(
                company_id  = 1,
                department  = a["department"],
                alert_type  = a["alert_type"],
                message     = a["message"],
                severity    = a["severity"],
                is_resolved = a["is_resolved"],
            )
            db.add(alert)

        await db.commit()
        print("\n✅ Seed complete!")
        print("\n🔐 Demo Login Credentials:")
        print("   Admin : alice@demo.com  / demo1234")
        print("   HR    : bob@demo.com    / demo1234")
        print("   Employee: david@demo.com / demo1234")
        print(f"\n📊 Seeded {len(FEEDBACK_SAMPLES)} feedback entries + 30 days trend data")


if __name__ == "__main__":
    asyncio.run(seed())
