export type TemplateInfo = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  users: string;
  description: string;
};

export const TEMPLATES: TemplateInfo[] = [
  { id: 'classic', name: 'Classic', category: 'professional', tags: ['ATS', 'pdf', 'docx'], users: '19M', description: 'Classically structured resume with a robust career history.' },
  { id: 'minimal', name: 'Minimal', category: 'simple', tags: ['ATS', 'pdf'], users: '12M', description: 'Clean, orderly structure with stylish minimalism.' },
  { id: 'professional', name: 'Professional', category: 'professional', tags: ['pdf', 'docx'], users: '6.7M', description: 'A touch of personality with well-organized structure.' },
  { id: 'modern', name: 'Modern', category: 'modern', tags: ['pdf'], users: '4.6M', description: 'Tech-inspired design with skill-point visuals.' },
  { id: 'corporate', name: 'Corporate', category: 'professional', tags: ['ATS', 'pdf', 'docx'], users: '5.1M', description: 'Professional and elegant with a timeline structure.' },
  { id: 'executive', name: 'Executive', category: 'professional', tags: ['pdf'], users: '2.3M', description: 'Streamlined multi-column structure for senior roles.' },
  { id: 'creative', name: 'Creative', category: 'creative', tags: ['pdf'], users: '3.6M', description: 'Artistic touches that showcase your expertise.' },
  { id: 'clean', name: 'Clean', category: 'simple', tags: ['ATS', 'pdf'], users: '2.2M', description: 'Modern template with bold, clean formatting.' },
];

export const TEMPLATE_CATEGORIES = ['all', 'ats', 'professional', 'modern', 'creative', 'simple'];

export const SAMPLE_DATA: {
  personal: {
    firstName: string; lastName: string; email: string; phone: string;
    location: string; website: string; linkedin: string; github: string; jobTitle: string;
  };
  summary: string;
  entries: { id: string; section: string; data: Record<string, string> }[];
  template: string;
  color: string;
} = {
  personal: {
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    website: 'alexjohnson.dev',
    linkedin: 'linkedin.com/in/alexjohnson',
    github: 'github.com/alexjohnson',
    jobTitle: 'Senior Software Engineer',
  },
  summary: 'Results-driven software engineer with 6+ years of experience building scalable web applications. Passionate about clean code and user-centric design.',
  entries: [
    {
      id: 'exp1',
      section: 'experience',
      data: {
        company: 'TechCorp Inc.',
        position: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        startDate: 'Jan 2022',
        endDate: '',
        current: 'true',
        description: 'Led development of microservices architecture serving 2M+ users.',
      },
    },
    {
      id: 'exp2',
      section: 'experience',
      data: {
        company: 'StartupXYZ',
        position: 'Full Stack Developer',
        location: 'Remote',
        startDate: 'Mar 2019',
        endDate: 'Dec 2021',
        current: 'false',
        description: 'Built React/Node.js platform from scratch, growing to 500K MAU.',
      },
    },
    {
      id: 'edu1',
      section: 'education',
      data: {
        institution: 'Stanford University',
        degree: 'B.S.',
        field: 'Computer Science',
        startDate: '2015',
        endDate: '2019',
        gpa: '3.9',
        description: '',
      },
    },
    { id: 'sk1', section: 'skills', data: { name: 'React', level: 'Expert' } },
    { id: 'sk2', section: 'skills', data: { name: 'TypeScript', level: 'Expert' } },
    { id: 'sk3', section: 'skills', data: { name: 'Node.js', level: 'Advanced' } },
    { id: 'sk4', section: 'skills', data: { name: 'Python', level: 'Advanced' } },
    { id: 'sk5', section: 'skills', data: { name: 'AWS', level: 'Intermediate' } },
  ],
  template: 'minimal',
  color: '#2563eb',
};
