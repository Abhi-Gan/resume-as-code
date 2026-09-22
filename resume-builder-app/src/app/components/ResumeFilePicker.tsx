import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronDown, FileText, FolderOpen } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface ResumeFileEntry {
  name: string
  mtimeMs: number
}

/**
 * Lists resume YAML files from data/resumes/ (served by the local export
 * service) and navigates to the live file-linked preview at /open/:name.
 */
export function ResumeFilePicker() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<ResumeFileEntry[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/resumes')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: ResumeFileEntry[]) => {
        if (!cancelled) setEntries(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground"
        >
          <FolderOpen data-icon="inline-start" />
          Open Resume
          <ChevronDown className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[28rem] max-w-[90vw]">
        {error && (
          <div className="px-2 py-1.5 text-xs text-destructive">
            Export service unavailable. Run{' '}
            <code className="font-mono">pnpm dev</code> to browse data/resumes.
          </div>
        )}
        {!error && entries === null && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Loading…
          </div>
        )}
        {!error && entries !== null && entries.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            No files in data/resumes/
          </div>
        )}
        {entries?.map((entry) => (
          <DropdownMenuItem
            key={entry.name}
            className="gap-1.5 text-xs"
            onSelect={() => navigate(`/open/${encodeURIComponent(entry.name)}`)}
          >
            <FileText className="shrink-0" />
            <span className="truncate">{entry.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
