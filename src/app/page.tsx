'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Link2, BarChart3, Plus, Copy, Trash2, ExternalLink, Search,
  TrendingUp, Globe, Monitor, MousePointer, Clock, Eye, EyeOff,
  Calendar, Link2Off, ChevronLeft, ChevronRight, RefreshCw, QrCode, Settings,
  ArrowUpRight, ArrowDownRight, Activity, PieChart, Check,
  X, Edit3, MoreHorizontal, Filter
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart as RPieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import CreatorSignature from '@/components/CreatorSignature'
import { CREATOR, copyright } from '@/lib/creator'

// ─── Types ───────────────────────────────────────────────
interface LinkItem {
  id: string
  originalUrl: string
  shortCode: string
  title: string | null
  clicks: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

interface OverviewStats {
  totalLinks: number
  totalClicks: number
  activeLinks: number
  expiredLinks: number
  recentClicks: number
  clicksByDay: { day: string; count: number }[]
  topLinks: LinkItem[]
}

interface LinkStats {
  link: LinkItem
  totalClicks: number
  periodClicks: number
  clicksByDay: { day: string; count: number }[]
  referrers: { referrer: string; count: number }[]
  browsers: { browser: string; count: number }[]
  devices: { device: string; count: number }[]
  countries: { country: string; count: number }[]
  recentClicks: Array<{
    id: string
    referrer: string | null
    browser: string | null
    device: string | null
    country: string | null
    createdAt: string
  }>
}

// ─── Colors ──────────────────────────────────────────────
const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6']
const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

// ─── Helpers ─────────────────────────────────────────────
// Short branded URL for display and copying
function shortUrl(code: string) {
  return `snip.link/${code}`
}

// Real redirect path on the current domain (works in preview)
function redirectPath(code: string) {
  return `/s/${code}`
}

function formatNumber(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

function truncateUrl(url: string, maxLen = 50) {
  if (url.length <= maxLen) return url
  return url.substring(0, maxLen) + '...'
}

function getDomainFromUrl(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

// ─── Stat Card Component ─────────────────────────────────
function StatCard({ title, value, icon: Icon, description, trend }: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  trend?: 'up' | 'down'
}) {
  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <div className="flex items-center gap-1">
                {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
                {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500" />}
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            )}
          </div>
          <div className="rounded-xl bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Mini Bar Chart Component ────────────────────────────
function MiniBarChart({ data }: { data: { day: string; count: number }[] }) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
  }

  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="flex items-end gap-1.5 h-32 px-2">
      {data.map((d, i) => (
        <TooltipProvider key={i}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full rounded-t-sm bg-primary/80 hover:bg-primary transition-colors cursor-pointer min-h-[4px]"
                  style={{ height: `${Math.max((d.count / maxCount) * 100, 4)}%` }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{d.count} clicks</p>
              <p className="text-xs text-muted-foreground">{d.day}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}

// ─── Main App Component ──────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [links, setLinks] = useState<LinkItem[]>([])
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [selectedLinkStats, setSelectedLinkStats] = useState<LinkStats | null>(null)
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [analyticsDays, setAnalyticsDays] = useState('7')

  // Create link form
  const [formUrl, setFormUrl] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formExpires, setFormExpires] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editLink, setEditLink] = useState<LinkItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [editExpires, setEditExpires] = useState('')

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch(`/api/links${searchQuery ? `?search=${searchQuery}` : ''}`)
      const data = await res.json()
      setLinks(data.links || [])
    } catch (err) {
      console.error('Failed to fetch links:', err)
    }
  }, [searchQuery])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])

  const fetchLinkStats = useCallback(async (linkId: string, days: number) => {
    try {
      const res = await fetch(`/api/links/${linkId}/stats?days=${days}`)
      const data = await res.json()
      setSelectedLinkStats(data)
    } catch (err) {
      console.error('Failed to fetch link stats:', err)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchLinks(), fetchStats()])
      setLoading(false)
    }
    load()
  }, [fetchLinks, fetchStats])

  useEffect(() => {
    if (selectedLinkId) {
      fetchLinkStats(selectedLinkId, parseInt(analyticsDays))
    }
  }, [selectedLinkId, analyticsDays, fetchLinkStats])

  // ─── Create Link Handler ────────────────────────
  const handleCreate = async () => {
    if (!formUrl.trim()) {
      toast.error('Please enter a URL')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: formUrl,
          shortCode: formCode || undefined,
          title: formTitle || undefined,
          expiresAt: formExpires || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to create link')
        return
      }

      const newLink = await res.json()
      toast.success('Link created successfully!')
      setCreateOpen(false)
      setFormUrl('')
      setFormCode('')
      setFormTitle('')
      setFormExpires('')
      fetchLinks()
      fetchStats()

      // Copy real working URL to clipboard
      const url = shortUrl(newLink.shortCode)
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    } catch (err) {
      toast.error('Failed to create link')
    } finally {
      setCreating(false)
    }
  }

  // ─── Delete Handler ─────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Link deleted')
        fetchLinks()
        fetchStats()
      }
    } catch {
      toast.error('Failed to delete link')
    }
  }

  // ─── Copy Handler ───────────────────────────────
  const handleCopy = async (shortCode: string) => {
    const url = shortUrl(shortCode)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  // ─── Edit Handler ───────────────────────────────
  const openEdit = (link: LinkItem) => {
    setEditLink(link)
    setEditTitle(link.title || '')
    setEditActive(link.isActive)
    setEditExpires(link.expiresAt ? format(new Date(link.expiresAt), 'yyyy-MM-dd') : '')
    setEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editLink) return
    try {
      const res = await fetch(`/api/links/${editLink.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          isActive: editActive,
          expiresAt: editExpires || null,
        }),
      })
      if (res.ok) {
        toast.success('Link updated')
        setEditOpen(false)
        fetchLinks()
      }
    } catch {
      toast.error('Failed to update link')
    }
  }

  // ─── Open Analytics ─────────────────────────────
  const openAnalytics = (linkId: string) => {
    setSelectedLinkId(linkId)
    setAnalyticsOpen(true)
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="Sniply" className="h-9 w-9 rounded-lg" />
                <div>
                  <h1 className="text-lg font-bold tracking-tight">Sniply</h1>
                  <p className="text-xs text-muted-foreground -mt-0.5">Link Shortener</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { fetchLinks(); fetchStats(); }}
                  className="gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                >
                  <Plus className="h-4 w-4" />
                  <span>Shorten Link</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tab Navigation */}
            <TabsList className="bg-slate-100 p-1 h-11">
              <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Activity className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="links" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Link2 className="h-4 w-4" />
                My Links
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* ─── Dashboard Tab ──────────────────────────── */}
            <TabsContent value="dashboard" className="space-y-6">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
                  ))}
                </div>
              ) : (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Total Links"
                      value={stats?.totalLinks ?? 0}
                      icon={Link2}
                      description="All time"
                    />
                    <StatCard
                      title="Total Clicks"
                      value={formatNumber(stats?.totalClicks ?? 0)}
                      icon={MousePointer}
                      description={`${stats?.recentClicks ?? 0} in last 7 days`}
                      trend="up"
                    />
                    <StatCard
                      title="Active Links"
                      value={stats?.activeLinks ?? 0}
                      icon={Globe}
                      description={`${stats?.expiredLinks ?? 0} expired`}
                    />
                    <StatCard
                      title="Avg. CTR"
                      value={stats?.totalLinks ? ((stats.totalClicks / stats.totalLinks)).toFixed(1) : '0'}
                      icon={TrendingUp}
                      description="clicks per link"
                      trend="up"
                    />
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Click Trends */}
                    <Card className="lg:col-span-2 border-border/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base font-semibold">Click Trends</CardTitle>
                            <CardDescription>Last 7 days performance</CardDescription>
                          </div>
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Live
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {stats && stats.clicksByDay.length > 0 ? (
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.clicksByDay}>
                                <defs>
                                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                <RTooltip
                                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#colorClicks)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-48 text-muted-foreground">
                            <div className="text-center">
                              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                              <p className="text-sm">Create some links to see click trends</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Top Links */}
                    <Card className="border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Top Links</CardTitle>
                        <CardDescription>By total clicks</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {stats && stats.topLinks.length > 0 ? (
                          <div className="space-y-3">
                            {stats.topLinks.map((link, i) => (
                              <div key={link.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => { setActiveTab('analytics'); openAnalytics(link.id) }}>
                                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                  i === 0 ? 'bg-amber-100 text-amber-700' :
                                  i === 1 ? 'bg-slate-100 text-slate-600' :
                                  i === 2 ? 'bg-orange-100 text-orange-700' :
                                  'bg-slate-50 text-slate-500'
                                }`}>
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {link.title || getDomainFromUrl(link.originalUrl)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">/{link.shortCode}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold">{formatNumber(link.clicks)}</p>
                                  <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                            No links yet
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Links Quick View */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold">Recent Links</CardTitle>
                          <CardDescription>Your latest shortened URLs</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setActiveTab('links')}>
                          View all <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {links.length > 0 ? (
                        <div className="space-y-2">
                          {links.slice(0, 5).map(link => (
                            <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                              <div className={`h-2 w-2 rounded-full ${link.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {link.title || truncateUrl(link.originalUrl, 40)}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{link.originalUrl}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">{link.clicks} clicks</Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopy(link.shortCode)}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Link2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground mb-3">No links created yet</p>
                          <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2">
                            <Plus className="h-3.5 w-3.5" /> Create your first link
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* ─── Links Tab ──────────────────────────────── */}
            <TabsContent value="links" className="space-y-6">
              {/* Back to Dashboard */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('dashboard')}
                className="gap-1.5 text-muted-foreground -ml-2 hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>

              {/* Search & Filter Bar */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by title, URL, or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[140px]">
                          <Filter className="h-3.5 w-3.5 mr-1" />
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Links</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Links Table */}
              <Card className="border-border/50">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-14 w-full" />
                      ))}
                    </div>
                  ) : links.length === 0 ? (
                    <div className="text-center py-16">
                      <Link2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                      <h3 className="text-lg font-medium mb-1">No links found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {searchQuery ? 'Try a different search term' : 'Create your first shortened link'}
                      </p>
                      {!searchQuery && (
                        <Button onClick={() => setCreateOpen(true)} className="gap-2">
                          <Plus className="h-4 w-4" /> Shorten a Link
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[50px]">Status</TableHead>
                            <TableHead>Link</TableHead>
                            <TableHead className="hidden md:table-cell">Short URL</TableHead>
                            <TableHead className="text-center">Clicks</TableHead>
                            <TableHead className="hidden sm:table-cell">Created</TableHead>
                            <TableHead className="hidden lg:table-cell">Expires</TableHead>
                            <TableHead className="w-[60px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {links.map(link => (
                            <TableRow key={link.id} className="group">
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className={`h-2.5 w-2.5 rounded-full ${link.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {link.isActive ? 'Active' : 'Inactive'}
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[280px]">
                                  <p className="text-sm font-medium truncate">
                                    {link.title || getDomainFromUrl(link.originalUrl)}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{link.originalUrl}</p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex items-center gap-1.5">
                                  <a
                                    href={redirectPath(link.shortCode)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs bg-slate-100 px-2 py-1 rounded font-mono hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                  >
                                    {shortUrl(link.shortCode)}
                                    <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                                  </a>
                                  <button onClick={() => handleCopy(link.shortCode)} className="text-muted-foreground hover:text-foreground transition-colors" title="Copy short URL">
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {formatNumber(link.clicks)}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
                                </p>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {link.expiresAt ? (
                                  <Badge variant={new Date(link.expiresAt) < new Date() ? 'destructive' : 'secondary'} className="text-xs">
                                    <Calendar className="h-2.5 w-2.5 mr-1" />
                                    {format(new Date(link.expiresAt), 'MMM d, yyyy')}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Never</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleCopy(link.shortCode)} className="gap-2">
                                      <Copy className="h-3.5 w-3.5" /> Copy URL
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setActiveTab('analytics'); openAnalytics(link.id) }} className="gap-2">
                                      <BarChart3 className="h-3.5 w-3.5" /> Analytics
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEdit(link)} className="gap-2">
                                      <Edit3 className="h-3.5 w-3.5" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => window.open(link.originalUrl, '_blank')} className="gap-2">
                                      <ExternalLink className="h-3.5 w-3.5" /> Visit Original
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDelete(link.id)} className="gap-2 text-red-600 focus:text-red-600">
                                      <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Analytics Tab ──────────────────────────── */}
            <TabsContent value="analytics" className="space-y-6">
              {/* Back to Dashboard */}
              {!selectedLinkId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('dashboard')}
                  className="gap-1.5 text-muted-foreground -ml-2 hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              )}

              {!selectedLinkId ? (
                <Card className="border-border/50">
                  <CardContent className="py-16 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium mb-1">Select a Link to Analyze</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose a link from your list to view detailed analytics
                    </p>
                    <div className="max-w-md mx-auto">
                      {links.length > 0 ? (
                        <div className="space-y-2 text-left">
                          {links.slice(0, 5).map(link => (
                            <button
                              key={link.id}
                              onClick={() => openAnalytics(link.id)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors text-left"
                            >
                              <div className="h-2 w-2 rounded-full bg-emerald-500" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{link.title || getDomainFromUrl(link.originalUrl)}</p>
                                <p className="text-xs text-muted-foreground">{shortUrl(link.shortCode)}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs">{link.clicks} clicks</Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                          ))}
                          {links.length > 5 && (
                            <Button variant="ghost" className="w-full text-xs" onClick={() => setActiveTab('links')}>
                              View all links
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button onClick={() => setCreateOpen(true)} className="gap-2">
                          <Plus className="h-4 w-4" /> Create a Link First
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : !selectedLinkStats ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
                  </div>
                  <Skeleton className="h-64" />
                </div>
              ) : (
                <>
                  {/* Analytics Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedLinkId(null); setSelectedLinkStats(null) }}
                          className="gap-1.5 h-7 text-xs"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Back
                        </Button>
                        <h2 className="text-lg font-semibold">
                          {selectedLinkStats.link.title || getDomainFromUrl(selectedLinkStats.link.originalUrl)}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 ml-9">
                        <a
                          href={redirectPath(selectedLinkStats.link.shortCode)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          {shortUrl(selectedLinkStats.link.shortCode)}
                          <ExternalLink className="h-2 w-2 inline ml-1 opacity-50" />
                        </a>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {selectedLinkStats.link.originalUrl}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-9 sm:ml-0">
                      <Select value={analyticsDays} onValueChange={setAnalyticsDays}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Last 24 hours</SelectItem>
                          <SelectItem value="7">Last 7 days</SelectItem>
                          <SelectItem value="30">Last 30 days</SelectItem>
                          <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => handleCopy(selectedLinkStats.link.shortCode)}>
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                      title="Total Clicks"
                      value={formatNumber(selectedLinkStats.totalClicks)}
                      icon={MousePointer}
                      description="All time"
                    />
                    <StatCard
                      title="Period Clicks"
                      value={selectedLinkStats.periodClicks}
                      icon={Activity}
                      description={`Last ${analyticsDays} days`}
                      trend="up"
                    />
                    <StatCard
                      title="Avg. Daily"
                      value={selectedLinkStats.clicksByDay.length > 0
                        ? (selectedLinkStats.periodClicks / selectedLinkStats.clicksByDay.length).toFixed(1)
                        : '0'
                      }
                      icon={TrendingUp}
                      description="clicks per day"
                    />
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Click Timeline */}
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Click Timeline</CardTitle>
                        <CardDescription>Clicks over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {selectedLinkStats.clicksByDay.length > 0 ? (
                          <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={selectedLinkStats.clicksByDay}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                <RTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
                            No clicks in this period
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Devices Breakdown */}
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Device Breakdown</CardTitle>
                        <CardDescription>Desktop vs Mobile vs Tablet</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {selectedLinkStats.devices.length > 0 ? (
                          <div className="h-52 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <RPieChart>
                                <Pie
                                  data={selectedLinkStats.devices}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={80}
                                  paddingAngle={4}
                                  dataKey="count"
                                  nameKey="device"
                                >
                                  {selectedLinkStats.devices.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <RTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                              </RPieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
                            No device data
                          </div>
                        )}
                        <div className="flex justify-center gap-4 mt-2">
                          {selectedLinkStats.devices.map((d, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <span className="text-xs text-muted-foreground">{d.device} ({d.count})</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Breakdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Referrers */}
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Referrers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedLinkStats.referrers.length > 0 ? (
                          <div className="space-y-3">
                            {selectedLinkStats.referrers.map((r, i) => {
                              const maxCount = selectedLinkStats.referrers[0].count
                              return (
                                <div key={i} className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="truncate max-w-[140px] text-xs">{r.referrer}</span>
                                    <span className="font-mono text-xs font-medium">{r.count}</span>
                                  </div>
                                  <Progress value={(r.count / maxCount) * 100} className="h-1.5" />
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">No referrer data</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Browsers */}
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Browsers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedLinkStats.browsers.length > 0 ? (
                          <div className="space-y-3">
                            {selectedLinkStats.browsers.map((b, i) => {
                              const maxCount = selectedLinkStats.browsers[0].count
                              return (
                                <div key={i} className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-xs">{b.browser}</span>
                                    <span className="font-mono text-xs font-medium">{b.count}</span>
                                  </div>
                                  <Progress value={(b.count / maxCount) * 100} className="h-1.5" />
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">No browser data</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Countries */}
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Locations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedLinkStats.countries.length > 0 ? (
                          <div className="space-y-3">
                            {selectedLinkStats.countries.map((c, i) => {
                              const maxCount = selectedLinkStats.countries[0].count
                              return (
                                <div key={i} className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-xs">{c.country}</span>
                                    <span className="font-mono text-xs font-medium">{c.count}</span>
                                  </div>
                                  <Progress value={(c.count / maxCount) * 100} className="h-1.5" />
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">No location data</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Clicks Table */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">Recent Clicks</CardTitle>
                      <CardDescription>Latest activity on this link</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedLinkStats.recentClicks.length > 0 ? (
                        <div className="overflow-x-auto max-h-72 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead>Time</TableHead>
                                <TableHead>Referrer</TableHead>
                                <TableHead>Browser</TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead>Location</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedLinkStats.recentClicks.map(click => (
                                <TableRow key={click.id}>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(click.createdAt), { addSuffix: true })}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {click.referrer ? (
                                      <span className="truncate max-w-[120px] block">{getDomainFromUrl(click.referrer)}</span>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">Direct</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs">{click.browser || '-'}</TableCell>
                                  <TableCell className="text-xs">{click.device || '-'}</TableCell>
                                  <TableCell className="text-xs">{click.country || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-6">No clicks recorded yet</p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{copyright('Sniply')}</p>
            <CreatorSignature variant="inline" />
          </div>
        </footer>

        {/* Creator Badge (bottom-right) */}
        <CreatorSignature variant="badge" />

        {/* Console Watermark */}
        <CreatorSignature variant="console" />

        {/* ─── Create Link Dialog ────────────────────────────── */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Link2 className="h-4 w-4 text-white" />
                </div>
                Shorten a Link
              </DialogTitle>
              <DialogDescription>
                Paste a long URL to create a short, trackable link
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-2">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="url">Destination URL <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="url"
                    placeholder="https://example.com/very/long/url/that/needs/shortening"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Custom Code */}
              <div className="space-y-2">
                <Label htmlFor="code">Custom Short Code (optional)</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
                    snip.link/
                  </div>
                  <Input
                    id="code"
                    placeholder="my-custom-code"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    className="pl-[6.5rem]"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty for an auto-generated code. Min 3 characters.
                </p>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  placeholder="Give your link a memorable name"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label htmlFor="expires">Expiration Date (optional)</Label>
                <Input
                  id="expires"
                  type="date"
                  value={formExpires}
                  onChange={(e) => setFormExpires(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              {/* Preview */}
              {formUrl && (
                <div className="rounded-lg bg-slate-50 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Preview</p>
                  <p className="text-sm font-mono text-emerald-600 font-medium">
                    {shortUrl(formCode || 'auto-generated')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">→ {formUrl}</p>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !formUrl.trim()}
                  className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  {creating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  {creating ? 'Creating...' : 'Create Short Link'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ─── Edit Link Dialog ─────────────────────────────── */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Edit Link
              </DialogTitle>
              <DialogDescription>Modify link settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Link title"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active Status</Label>
                  <p className="text-xs text-muted-foreground">Inactive links won&apos;t redirect</p>
                </div>
                <Switch checked={editActive} onCheckedChange={setEditActive} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expires">Expiration Date</Label>
                <Input
                  id="edit-expires"
                  type="date"
                  value={editExpires}
                  onChange={(e) => setEditExpires(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={handleEdit} className="gap-2">Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
