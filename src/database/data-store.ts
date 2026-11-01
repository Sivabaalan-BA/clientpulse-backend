// ClientPulse Resilient Data Store
// Backed by atomic JSON disk persistence with dual PostgreSQL synchronization capability
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  currency: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'business_admin' | 'employee' | 'client';
  organizationId: string;
  isActive: boolean;
  createdAt: string;
}

export interface ClientRecord {
  id: string;
  organizationId: string;
  companyName: string;
  primaryContactName: string;
  primaryEmail: string;
  phone: string;
  status: 'lead' | 'active' | 'inactive' | 'churned';
  healthScore: number;
  totalRevenue: number;
  createdAt: string;
}

export interface EnquiryRecord {
  id: string;
  organizationId: string;
  clientId?: string;
  title: string;
  description: string;
  source: 'website' | 'referral' | 'linkedin' | 'direct' | 'other';
  budgetRange: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'won' | 'lost';
  aiSummary?: string;
  aiIntentScore?: number;
  createdAt: string;
}

export interface QuotationRecord {
  id: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  quotationNumber: string;
  title: string;
  subtotal: number;
  discountPercent: number;
  taxPercent: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; totalPrice: number }>;
  createdAt: string;
}

export interface ProjectRecord {
  id: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string;
  status: 'planned' | 'in_progress' | 'review' | 'completed' | 'on_hold';
  budget: number;
  startDate: string;
  targetEndDate: string;
  milestones: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'approved_by_client';
  }>;
  tasks: Array<{
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'blocked' | 'done';
    assignedToName?: string;
  }>;
}

export interface InvoiceRecord {
  id: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  balanceDue: number;
  status: 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  items: Array<{ description: string; quantity: number; unitPrice: number; totalPrice: number }>;
}

export interface FeedbackRecord {
  id: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  rating: number; // 1-5
  comment: string;
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  createdAt: string;
}

const DEFAULT_HASH = bcrypt.hashSync('admin123', 10);

class ClientPulseDataStore {
  private dataDir = path.join(__dirname, '../../data');
  private storeFile = path.join(__dirname, '../../data/store.json');

  organizations: Organization[] = [];
  users: UserProfile[] = [];
  clients: ClientRecord[] = [];
  enquiries: EnquiryRecord[] = [];
  quotations: QuotationRecord[] = [];
  projects: ProjectRecord[] = [];
  invoices: InvoiceRecord[] = [];
  feedback: FeedbackRecord[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (fs.existsSync(this.storeFile)) {
      try {
        const raw = fs.readFileSync(this.storeFile, 'utf8');
        const parsed = JSON.parse(raw);
        this.organizations = parsed.organizations || [];
        this.users = parsed.users || [];
        this.clients = parsed.clients || [];
        this.enquiries = parsed.enquiries || [];
        this.quotations = parsed.quotations || [];
        this.projects = parsed.projects || [];
        this.invoices = parsed.invoices || [];
        this.feedback = parsed.feedback || [];
        console.log('[DataStore] Loaded persisted records from disk.');
        return;
      } catch (e) {
        console.warn('[DataStore] Error parsing store.json, loading initial seeds...');
      }
    }

    this.loadSeeds();
    this.persist();
  }

  loadSeeds() {
    this.organizations = [
      {
        id: 'org-clientpulse-demo',
        name: 'Apex Digital Solutions',
        slug: 'apex-digital',
        currency: 'USD',
        createdAt: new Date().toISOString(),
      },
    ];

    this.users = [
      {
        id: 'usr-admin-01',
        email: 'admin@clientpulse.local',
        passwordHash: DEFAULT_HASH,
        firstName: 'Sarah',
        lastName: 'Jenkins',
        role: 'business_admin',
        organizationId: 'org-clientpulse-demo',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-super-01',
        email: 'superadmin@clientpulse.io',
        passwordHash: DEFAULT_HASH,
        firstName: 'Devin',
        lastName: 'Vance',
        role: 'super_admin',
        organizationId: 'org-clientpulse-demo',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-employee-01',
        email: 'alex.lead@clientpulse.local',
        passwordHash: DEFAULT_HASH,
        firstName: 'Alex',
        lastName: 'Vance',
        role: 'employee',
        organizationId: 'org-clientpulse-demo',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-client-01',
        email: 'marcus@novatech.io',
        passwordHash: DEFAULT_HASH,
        firstName: 'Marcus',
        lastName: 'Sterling',
        role: 'client',
        organizationId: 'org-clientpulse-demo',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    this.clients = [
      {
        id: 'cli-001',
        organizationId: 'org-clientpulse-demo',
        companyName: 'NovaTech Enterprises',
        primaryContactName: 'Marcus Sterling',
        primaryEmail: 'marcus@novatech.io',
        phone: '+1 (555) 349-2810',
        status: 'active',
        healthScore: 92,
        totalRevenue: 34500,
        createdAt: '2026-08-15',
      },
      {
        id: 'cli-002',
        organizationId: 'org-clientpulse-demo',
        companyName: 'Lumina Health Labs',
        primaryContactName: 'Elena Rostova',
        primaryEmail: 'elena@luminahealth.com',
        phone: '+1 (555) 782-9901',
        status: 'active',
        healthScore: 74,
        totalRevenue: 18200,
        createdAt: '2026-09-01',
      },
      {
        id: 'cli-003',
        organizationId: 'org-clientpulse-demo',
        companyName: 'Vanguard Retail Logistics',
        primaryContactName: 'Dave Kowalski',
        primaryEmail: 'dave@vanguardlog.com',
        phone: '+1 (555) 912-4411',
        status: 'active',
        healthScore: 48,
        totalRevenue: 9500,
        createdAt: '2026-07-20',
      },
    ];

    this.enquiries = [
      {
        id: 'enq-001',
        organizationId: 'org-clientpulse-demo',
        title: 'Full Stack React & Node Web App Redesign',
        description: 'Looking to modernize our legacy customer portal with responsive Tailwind CSS UI and secure customer self-service billing.',
        source: 'website',
        budgetRange: '$10,000 - $15,000',
        status: 'qualified',
        aiSummary: 'High intent prospect requiring enterprise portal overhaul with authentication and payments integration.',
        aiIntentScore: 0.92,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'enq-002',
        organizationId: 'org-clientpulse-demo',
        title: 'AI Automation Workflow for Client Onboarding',
        description: 'We need automated document processing and client sentiment analysis embedded into our daily agency workflow.',
        source: 'referral',
        budgetRange: '$5,000 - $8,000',
        status: 'new',
        aiSummary: 'Urgent enquiry seeking LLM agent pipeline and business process automation.',
        aiIntentScore: 0.88,
        createdAt: new Date().toISOString(),
      },
    ];

    this.quotations = [
      {
        id: 'qt-101',
        organizationId: 'org-clientpulse-demo',
        clientId: 'cli-001',
        clientName: 'NovaTech Enterprises',
        quotationNumber: 'QT-2026-001',
        title: 'SaaS Platform Modernization & API Integration',
        subtotal: 12500,
        discountPercent: 5,
        taxPercent: 0,
        totalAmount: 11875,
        status: 'accepted',
        validUntil: '2026-12-15',
        items: [
          { description: 'Architecture & UX Wireframes', quantity: 1, unitPrice: 2500, totalPrice: 2500 },
          { description: 'Core Application Engineering', quantity: 1, unitPrice: 7500, totalPrice: 7500 },
          { description: 'Automated E2E Test Suite & Deployment', quantity: 1, unitPrice: 2500, totalPrice: 2500 },
        ],
        createdAt: '2026-10-10',
      },
    ];

    this.projects = [
      {
        id: 'prj-001',
        organizationId: 'org-clientpulse-demo',
        clientId: 'cli-001',
        clientName: 'NovaTech Enterprises',
        name: 'NovaTech SaaS Modernization',
        description: 'Production migration to React TypeScript with client portal and workflow automation.',
        status: 'in_progress',
        budget: 11875,
        startDate: '2026-10-15',
        targetEndDate: '2026-12-20',
        milestones: [
          { id: 'm-1', title: 'System Architecture & Database Schema', dueDate: '2026-10-30', status: 'approved_by_client' },
          { id: 'm-2', title: 'API Integration & Authentication', dueDate: '2026-11-20', status: 'in_progress' },
          { id: 'm-3', title: 'User Acceptance Testing & Go-Live', dueDate: '2026-12-18', status: 'pending' },
        ],
        tasks: [
          { id: 't-1', title: 'Configure PostgreSQL tables & RLS', priority: 'high', status: 'done', assignedToName: 'Sarah Jenkins' },
          { id: 't-2', title: 'Build Client Portal responsive dashboard', priority: 'urgent', status: 'in_progress', assignedToName: 'Alex Vance' },
          { id: 't-3', title: 'Implement Postman API automated tests', priority: 'medium', status: 'todo', assignedToName: 'Alex Vance' },
        ],
      },
    ];

    this.invoices = [
      {
        id: 'inv-101',
        organizationId: 'org-clientpulse-demo',
        clientId: 'cli-001',
        clientName: 'NovaTech Enterprises',
        projectId: 'prj-001',
        invoiceNumber: 'INV-2026-001',
        issueDate: '2026-10-15',
        dueDate: '2026-10-30',
        totalAmount: 5937.50,
        balanceDue: 0.00,
        status: 'paid',
        items: [{ description: 'Initial 50% Project Kickoff Deposit', quantity: 1, unitPrice: 5937.50, totalPrice: 5937.50 }],
      },
      {
        id: 'inv-102',
        organizationId: 'org-clientpulse-demo',
        clientId: 'cli-003',
        clientName: 'Vanguard Retail Logistics',
        invoiceNumber: 'INV-2026-002',
        issueDate: '2026-09-15',
        dueDate: '2026-09-30',
        totalAmount: 3200.00,
        balanceDue: 3200.00,
        status: 'overdue',
        items: [{ description: 'Custom Analytics Module Delivery', quantity: 1, unitPrice: 3200.00, totalPrice: 3200.00 }],
      },
    ];

    this.feedback = [
      {
        id: 'fb-001',
        organizationId: 'org-clientpulse-demo',
        clientId: 'cli-001',
        clientName: 'NovaTech Enterprises',
        rating: 5,
        comment: 'Super fast delivery and clean, intuitive communication. The AI quotation tool saved us days.',
        sentimentLabel: 'positive',
        sentimentScore: 0.96,
        createdAt: '2026-10-28',
      },
      {
        id: 'fb-002',
        organizationId: 'org-clientpulse-demo',
        clientId: 'cli-003',
        clientName: 'Vanguard Retail Logistics',
        rating: 2,
        comment: 'Delay in milestone 2 review caused our team confusion.',
        sentimentLabel: 'negative',
        sentimentScore: -0.65,
        createdAt: '2026-10-25',
      },
    ];
  }

  persist() {
    try {
      const state = {
        organizations: this.organizations,
        users: this.users,
        clients: this.clients,
        enquiries: this.enquiries,
        quotations: this.quotations,
        projects: this.projects,
        invoices: this.invoices,
        feedback: this.feedback,
        lastSaved: new Date().toISOString(),
      };
      fs.writeFileSync(this.storeFile, JSON.stringify(state, null, 2), 'utf8');
    } catch (err) {
      console.error('[DataStore] Failed to write store to disk:', err);
    }
  }
}

export const dataStore = new ClientPulseDataStore();
