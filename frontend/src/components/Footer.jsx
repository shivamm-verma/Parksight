const COLUMNS = [
  { heading: 'Platform', links: ['Hotspot Detection', 'Impact Scoring', 'Enforcement API'] },
  { heading: 'Solutions', links: ['Traffic Police', 'Municipal Bodies', 'Smart Cities'] },
  { heading: 'Resources', links: ['Dataset', 'Documentation', 'Status'] },
  { heading: 'Company', links: ['About', 'Contact'] },
]

export default function Footer() {
  return (
    <footer className="bg-[#1d1d1f] text-[#a1a1a6] pt-12 sm:pt-16 pb-8 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-white text-[13px] font-semibold mb-4">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l} className="text-[13px] hover:text-white transition-colors cursor-pointer">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px]">© 2026 ParkSight. AI-driven parking intelligence, built as a UI concept.</p>
          <div className="flex gap-5 text-[12px]">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
