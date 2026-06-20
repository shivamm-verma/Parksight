import { useState } from 'react'
import NavBar from '../components/NavBar.jsx'
import Footer from '../components/Footer.jsx'
import LinkedinIcon from '../components/icons/LinkedinIcon.jsx'

// Edit this array with real names, roles, LinkedIn URLs, and photo URLs.
// Right now all 4 cards use the same person's data as a placeholder —
// swap entries 2, 3 and 4 for the other three teammates.
const TEAM = [
  {
    name: 'Suhani Nagpal',
    role: 'AI Engineer',
    initials: 'SN',
    linkedin: 'https://www.linkedin.com/in/suhani-nagpal-388b68291/',
    photo:
      'https://media.licdn.com/dms/image/v2/D5603AQElnX3d1eGmOQ/profile-displayphoto-crop_800_800/B56ZgopsQ.H0AI-/0/1753028676333?e=1783555200&v=beta&t=pxfxjCFUJTvLDeKLSg2yqjOxcj-Y8J3gKFVojQlcxWI',
  },
  {
    name: 'Nishtha Dhawan',
    role: 'AI Engineer',
    initials: 'ND',
    linkedin: 'https://www.linkedin.com/in/nishthadhawan27/',
    photo:
      'https://media.licdn.com/dms/image/v2/D5603AQGY4jWc6PPh7A/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1703488358306?e=1783555200&v=beta&t=qqd3sQJhvCCLZqfSY4phS1L28h4a_EHPpQNrSBdUwGI',
  },
  {
    name: 'Shivam Verma',
    role: 'Developer',
    initials: 'SV',
    linkedin: 'https://www.linkedin.com/in/shivamm-verma/',
    photo:
      'https://media.licdn.com/dms/image/v2/D5603AQFYA3--Kqcjpg/profile-displayphoto-scale_400_400/B56Z4LUpSFJ0Ag-/0/1778306426009?e=1783555200&v=beta&t=gdJgEdhOl0FLUgYC7APJI_kdZK9HMT08wgXmU6EX9Os',
  },
  {
    name: 'Damanpreet Singh',
    role: 'Developer',
    initials: 'DS',
    linkedin: 'https://www.linkedin.com/in/damanpreet-singh-069b99268/',
    photo:
      'https://media.licdn.com/dms/image/v2/D5603AQGDAuXz-q7_jA/profile-displayphoto-shrink_800_800/B56ZaqfbH4GoAc-/0/1746617089251?e=1783555200&v=beta&t=Eb5VrMhM7DWAIN5tGV-VxiXyz5K_TQ4h5tJTS4M_V58',
  },
]

function Avatar({ name, initials, photo }) {
  const [failed, setFailed] = useState(false)

  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setFailed(true)}
        className="w-24 h-24 rounded-full object-cover ring-1 ring-white/70 shadow-md"
      />
    )
  }
  return (
    <div className="w-24 h-24 rounded-full bg-white/70 flex items-center justify-center ring-1 ring-white/70 shadow-md">
      <span className="text-[24px] font-semibold text-[var(--red)] tracking-tight">{initials}</span>
    </div>
  )
}

export default function Developers() {
  return (
    <div className="min-h-screen">
      <NavBar />

      {/* header block, white */}
      <section className="bg-white pt-40 pb-20 px-6 text-center">
        <p className="text-[13px] font-semibold tracking-[0.18em] text-[var(--red)] uppercase mb-6">
          The Team
        </p>
        <h1 className="font-impact text-balance text-[44px] sm:text-[64px] leading-[0.95] text-[var(--ink)]">
          BUILT BY FOUR PEOPLE
        </h1>
        <p className="mt-6 text-[18px] sm:text-[20px] text-[var(--ink-soft)] max-w-2xl mx-auto leading-relaxed">
          The team behind ParkSight's hotspot detection model, dashboard and
          enforcement-facing platform.
        </p>
      </section>

      {/* team grid, grey, with liquid-glass cards over soft color blobs */}
      <section className="relative bg-[var(--grey-bg)] py-20 px-6 overflow-hidden">
        {/* blurred color blobs sitting behind the glass cards */}
        <div className="pointer-events-none absolute -top-24 -left-20 w-[420px] h-[420px] rounded-full bg-[var(--red)]/12 blur-3xl" />
        <div className="pointer-events-none absolute top-40 right-[-120px] w-[380px] h-[380px] rounded-full bg-orange-200/45 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-140px] left-1/3 w-[460px] h-[460px] rounded-full bg-rose-200/30 blur-3xl" />

        <div className="relative max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM.map((person, i) => (
            <div
              key={i}
              className="rounded-[32px] p-8 flex flex-col items-center text-center
                         bg-white/45 backdrop-blur-2xl border border-white/60
                         shadow-[0_8px_30px_rgba(0,0,0,0.08)]
                         hover:-translate-y-1.5 hover:bg-white/60 hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]
                         transition-all duration-300"
            >
              <Avatar name={person.name} initials={person.initials} photo={person.photo} />
              <h3 className="mt-5 text-[17px] font-semibold text-[var(--ink)]">{person.name}</h3>
              <p className="mt-1 text-[13px] text-[var(--ink-soft)]">{person.role}</p>

              <a
                href={person.linkedin}
                target="_blank"
                rel="noreferrer"
                className="mt-5 w-9 h-9 rounded-full bg-white/70 flex items-center justify-center hover:bg-[var(--red)] group transition-colors"
                aria-label={`${person.name} on LinkedIn`}
              >
                <LinkedinIcon className="w-4 h-4 text-[var(--red)] group-hover:text-white transition-colors" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* closing strip, white */}
      <section className="bg-white py-20 px-6 text-center">
        <p className="text-[15px] text-[var(--ink-soft)] max-w-xl mx-auto leading-relaxed">
          Want to know more about how the model works?{' '}
          <a href="/dashboard" className="text-[var(--red)] font-medium hover:underline">
            See it in the dashboard →
          </a>
        </p>
      </section>

      <Footer />
    </div>
  )
}
