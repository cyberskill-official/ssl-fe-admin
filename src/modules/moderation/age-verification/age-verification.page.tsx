import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    FileText,
    Filter,
    Search,
    Shield,
    TrendingUp,
    UserCheck,
    Users,
    UserX,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import type { T_User } from '#shared/graphql';

import { useGetUsers } from '#modules/user/user.hook';
import { Badge, Button, Dialog, DialogContent, DialogTitle, Input, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip, TooltipContent, TooltipTrigger } from '#shared/component';
import { usePendingCounts } from '#shared/context/pending-count.context';
import { usePortal } from '#shared/portal';
import { cn } from '#shared/util';

import type { I_ProfileCardProps } from './components/profile-card';

import { useAgeVerification } from './age-verification.hook';
import { ProfileCard } from './components/profile-card';

const WHITESPACE_RE = /\s+/g;

function generateAgeVerificationPDF(user: any) {
    const documentId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Age Verification & Content Provider Agreement</title>
    <style>
        body { font-family: 'Arial', sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 10px 0; font-size: 24px; color: #2c3e50; }
        .status { background: #4CAF50; color: white; padding: 8px 20px; border-radius: 25px; font-size: 14px; display: inline-block; margin-top: 10px; }
        .section { margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 4px solid #4CAF50; }
        .section-title { font-weight: bold; font-size: 18px; margin-bottom: 15px; color: #2c3e50; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .info-row { margin: 12px 0; display: flex; }
        .label { font-weight: bold; color: #555; min-width: 180px; }
        .value { color: #333; flex: 1; }
        .agreement-content { margin: 20px 0; padding: 20px; background: white; border: 1px solid #ddd; border-radius: 5px; }
        .agreement-content h2 { text-align: center; color: #2c3e50; font-size: 20px; margin-bottom: 10px; }
        .agreement-content h3 { color: #34495e; font-size: 16px; margin-top: 20px; margin-bottom: 10px; }
        .agreement-content p, .agreement-content li { color: #555; line-height: 1.8; margin: 10px 0; }
        .agreement-content ul, .agreement-content ol { margin-left: 30px; }
        .signature-section { margin: 30px 0; padding: 20px; background: #f0f8ff; border: 2px solid #4CAF50; border-radius: 5px; }
        .signature-row { margin: 20px 0; padding: 15px 0; border-bottom: 2px solid #333; }
        .signature-label { font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
        .signature-value { font-family: 'Brush Script MT', cursive; font-size: 20px; color: #4CAF50; }
        .footer { margin-top: 50px; border-top: 2px solid #ccc; padding-top: 20px; text-align: center; color: #777; font-size: 12px; }
        .page-break { page-break-before: always; }
        .certification-box { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #4CAF50; }
    </style>
</head>
<body>
    <!-- Page 1: Age Verification -->
    <div class="header">
        <h1>🔒 Age Verification & Content Provider Agreement</h1>
        <span class="status">✓ VERIFIED & APPROVED</span>
        <p style="margin-top: 15px; color: #666;">Document ID: ${documentId}</p>
    </div>
    
    <div class="section">
        <div class="section-title">📋 Age Verification Details</div>
        <div class="info-row">
            <span class="label">Profile Name:</span> 
            <span class="value">${user.name}</span>
        </div>
        <div class="info-row">
            <span class="label">Date of Birth:</span> 
            <span class="value">${user.birth}</span>
        </div>
        <div class="info-row">
            <span class="label">Age:</span> 
            <span class="value">${user.age} years old</span>
        </div>
        <div class="info-row">
            <span class="label">Verification Method:</span> 
            <span class="value">${user.method}</span>
        </div>
        <div class="info-row">
            <span class="label">Verification Date:</span> 
            <span class="value">${user.date} at ${user.time}</span>
        </div>
        <div class="info-row">
            <span class="label">Approved By:</span> 
            <span class="value">${user.approvedBy} (Platform Moderator)</span>
        </div>
    </div>
    
    <div class="certification-box">
        <p><strong>✓ Official Certification:</strong></p>
        <p>This document certifies that the above-mentioned user <strong>${user.name}</strong> has been verified to be <strong>18 years of age or older</strong> according to our dual verification procedures (AI pre-verification + manual moderator approval) as required by platform policies and applicable regulations.</p>
    </div>

    <!-- Page 2: Content Provider Agreement -->
    <div class="page-break"></div>
    
    <div class="agreement-content">
        <h2>📄 Content Provider Agreement</h2>
        <p><strong>Effective Date: 14.01.2025</strong></p>
        
        <h3>Between:</h3>
        <p><strong>Platform:</strong> Jolo Media ApS, Parkvej 5, 7500 Holstebro, Denmark ("Platform" or "Company")</p>
        <p><strong>Content Provider:</strong> ${user.name} ("Provider")</p>

        <h3>1. Purpose</h3>
        <p>This Agreement governs the terms under which the Provider submits content (photos, videos, text, or other media) to the Platform Secret<sup>®</sup> Swinger Lust, operated by Jolo Media ApS. The Agreement ensures legal compliance, appropriate use, and content ownership verification.</p>

        <h3>2. Eligibility and Verification</h3>
        <p><strong>2.1.</strong> The Provider confirms they are at least 18 years old and have completed age verification through a dual process: initial AI-based pre-verification followed by manual approval by a moderator.</p>
        <p><strong>2.2.</strong> If the content includes other identifiable individuals, the Provider confirms they have obtained documented consent from all persons involved, including proof of age (18+).</p>
        <p><strong>2.3.</strong> The Provider has passed identity verification (ID upload) before being allowed to upload content.</p>
        <p><strong>2.4. Consents of Depicted Persons (i–iii).</strong> The Provider warrants it has obtained written consent from all depicted persons covering:</p>
        <ul>
            <li>(i) Consent to be depicted in the content;</li>
            <li>(ii) Consent to public distribution and upload of the content to the Company's website(s) and services;</li>
            <li>(iii) If applicable, where content is made available for downloading by other users, consent to have the content downloaded. (If downloads are not enabled on the Platform, this item is not applicable.)</li>
        </ul>
        <p><strong>2.5. Records on Request.</strong> The Provider shall maintain and, upon the Company's written request, promptly provide supporting documents evidencing identity and age (18+) and the written consents in 2.4 for all persons depicted (including copies of IDs and relevant logs/attestations).</p>

        <h3>3. License Grant</h3>
        <p><strong>3.1.</strong> The Provider grants the Platform a worldwide, non-exclusive, royalty-free, sublicensable license to use, display, store, reproduce, distribute, and modify the content on and in relation to the Platform.</p>
        <p><strong>3.2.</strong> The license includes the right to use the content for promotional and marketing purposes across Platform-owned channels, including but not limited to email, advertising, and social media, unless the Provider explicitly opts out in writing.</p>
        <p><strong>3.3.</strong> This license continues for as long as the Provider maintains an account and may extend beyond account closure for archived or legally required purposes.</p>
        <p><strong>3.4. Download Modality.</strong> Content on the Platform is provided for streaming/viewing. User downloads are not enabled unless explicitly stated by the Platform. If the Platform enables downloads for specific features in the future, item 2.4(iii) shall apply.</p>

        <h3>4. Ownership and Warranties</h3>
        <p><strong>4.1.</strong> The Provider guarantees they are the sole owner of the content or have full rights and permissions to submit it.</p>
        <p><strong>4.2.</strong> The Provider confirms the content does not infringe any third-party rights, including copyrights, trademarks, privacy rights, or moral rights.</p>
        <p><strong>4.3.</strong> The Provider agrees not to upload content that is illegal, violent, hateful, non-consensual, AI-generated, manipulated to appear non-consensual, or includes third-party pornographic material (e.g., content from OnlyFans, Pornhub, etc.).</p>
        <p><strong>4.4.</strong> The Provider confirms that no AI-generated, synthetic, or altered visual content depicting real individuals in sexual contexts will be submitted without their explicit and documented consent.</p>
        <p><strong>4.5. Compliance with Card Brand & Bank Policies.</strong> The Provider shall not upload or engage in any activity that is illegal or violates Card Brand rules (e.g., Visa/Mastercard standards) or the Acquirer/Processor's policies applicable to the Platform. The Provider agrees to comply with updates to such standards and policies as notified by the Company.</p>

        <h3>5. Moderation and Platform Rights</h3>
        <p><strong>5.1.</strong> All uploaded content is subject to moderation by AI and human review. The Platform reserves the right to remove or reject any content without prior notice.</p>
        <p><strong>5.2.</strong> The Platform may issue warnings, suspend, or permanently ban a Provider if the content violates platform rules or receives repeated complaints.</p>
        <p><strong>5.3.</strong> If a profile is flagged by three or more unique users, a red flag will be triggered. The profile may receive a warning, be deleted, and/or be IP-banned at the Platform's discretion.</p>

        <h3>6. Third-Party Use Disclaimer</h3>
        <p>The Platform is not responsible for unauthorized redistribution or misuse of content by other users or external actors, provided that the Platform has implemented appropriate technical and moderation safeguards.</p>

        <h3>7. Sensitive Content & Privacy</h3>
        <p><strong>7.1.</strong> The Platform agrees not to sell, rent, or otherwise share personal content or identifiable information of the Provider to third parties outside of operational or legal obligations.</p>
        <p><strong>7.2.</strong> The Provider has the right to request deletion of their content and personal data under applicable data protection laws, subject to legal and regulatory retention requirements.</p>

        <h3>8. Compensation</h3>
        <p>This Agreement does not entitle the Provider to financial compensation unless otherwise agreed in a separate written contract.</p>

        <h3>9. Confidentiality</h3>
        <p>Both parties agree to keep confidential any non-public technical, commercial, or operational information shared under this Agreement.</p>

        <h3>10. Data Protection</h3>
        <p><strong>10.1.</strong> The Platform processes all personal data in accordance with the GDPR.</p>
        <p><strong>10.2.</strong> A separate Data Processing Agreement (DPA) applies if the Provider handles user data on behalf of the Platform.</p>

        <h3>11. Termination</h3>
        <p><strong>11.1.</strong> This Agreement is valid until terminated in writing by either party.</p>
        <p><strong>11.2.</strong> The Platform may delete content or accounts that violate these terms without refund or further liability.</p>

        <h3>12. Governing Law</h3>
        <p>This Agreement is governed by the laws of Denmark. Any disputes shall be resolved in the courts of Denmark.</p>

        <h3>13. Card Brand / Compliance Cooperation</h3>
        <p>The Provider agrees to cooperate with reasonable compliance requests from the Company, its payment processor(s), acquiring bank(s), or regulators, including timely provision of records described in 2.5 and prompt remediation of any non-compliant content or behavior.</p>
    </div>

    <!-- Signature Section -->
    <div class="signature-section">
        <h3 style="text-align: center; color: #2c3e50; margin-bottom: 25px;">🔒 Digital Signatures</h3>
        
        <div class="signature-row">
            <div class="signature-label">Platform Representative:</div>
            <div class="signature-value">Jolo Media ApS - ${user.approvedBy}</div>
            <div style="color: #666; margin-top: 5px;">Date: ${user.date}</div>
        </div>
        
        <div class="signature-row">
            <div class="signature-label">Content Provider (Username):</div>
            <div class="signature-value">${user.name}</div>
            <div style="color: #666; margin-top: 5px;">Date: ${user.date}</div>
        </div>

        <div style="margin-top: 25px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px;">
            <p style="margin: 0; color: #856404; font-size: 13px;">
                <strong>⚠️ Legal Notice:</strong> By accepting age verification and using the platform, ${user.name} digitally agrees to and accepts all terms of this Content Provider Agreement as of ${user.date}. This constitutes a legally binding electronic signature under applicable law.
            </p>
        </div>
    </div>
    
    <div class="footer">
        <p><strong>Document Generated:</strong> ${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'long' })}</p>
        <p><strong>Document ID:</strong> ${documentId}</p>
        <p style="margin-top: 15px;">This is an official document from Secret Swinger Lust Platform</p>
        <p>Jolo Media ApS | Parkvej 5, 7500 Holstebro, Denmark</p>
    </div>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 1500);
    }
    else {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `age-verification-agreement-${user.name.replace(WHITESPACE_RE, '-')}-${Date.now()}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

const stats = [
    {
        title: 'Pending Reviews',
        value: 0,
        icon: Clock,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/50',
        borderColor: 'border-orange-200 dark:border-orange-700',
    },
    {
        title: 'Approved Today',
        value: 0,
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/50',
        borderColor: 'border-green-200 dark:border-green-700',
    },
    {
        title: 'Total Verified',
        value: 0,
        icon: Shield,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/50',
        borderColor: 'border-blue-200 dark:border-blue-700',
    },
    {
        title: 'Success Rate',
        value: '0%',
        icon: TrendingUp,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/50',
        borderColor: 'border-purple-200 dark:border-purple-700',
    },
];

function StatsCard({ title, value, icon: Icon, color, bgColor, borderColor }: any) {
    return (
        <div className={cn(
            'p-6 rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-105',
            bgColor,
            borderColor,
        )}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
                </div>
                <div className={cn('p-3 rounded-lg', bgColor)}>
                    <Icon className={cn('w-6 h-6', color)} />
                </div>
            </div>
        </div>
    );
}

function transformUserToProfileCard(user: T_User): I_ProfileCardProps | null {
    if (!user.ageVerify || (user.ageVerify.status !== 'PENDING' && user.ageVerify.status !== 'REJECTED')) {
        return null;
    }

    const aiResult = user.ageVerify.preApproval?.aiResult;
    const documentAge = aiResult?.documentAge || 0;
    const documentPic = user.ageVerify.preApproval?.documentPic ?? '';
    const selfiePic = user.ageVerify.preApproval?.selfiePic ?? '';

    return {
        id: user.id || '',
        name: user.username || user.username || 'Unknown User',
        age: documentAge,
        documentType: user.ageVerify.method || 'Unknown',
        idImage: documentPic as string,
        selfieImage: selfiePic as string,
        submittedAt: new Date(user.createdAt).toLocaleString(),
        priority: 'medium',
        status: user.ageVerify.status,
        reason: user.ageVerify.reason ?? undefined,
        userId: user.id || '',
    };
}

function transformApprovedUser(user: T_User) {
    if (!user.ageVerify || user.ageVerify.status !== 'APPROVED') {
        return null;
    }

    const aiResult = user.ageVerify.preApproval?.aiResult;
    const documentAge = aiResult?.documentAge || 0;
    const dateOfBirth = aiResult?.dateOfBirth || user.ageVerify.dateOfBirth;

    const userData = {
        id: user.id,
        name: user.username || user.username || 'Unknown User',
        date: new Date(user.ageVerify.approvedAt || user.updatedAt).toLocaleDateString(),
        time: new Date(user.ageVerify.approvedAt || user.updatedAt).toLocaleTimeString(),
        approvedBy: user.ageVerify.approvedBy?.username || user.ageVerify.approvedBy?.username || 'Admin',
        method: user.ageVerify.method || 'Unknown',
        birth: dateOfBirth ? new Date(dateOfBirth).toLocaleDateString() : 'N/A',
        age: documentAge,
        status: 'verified',
        agreement: user.ageVerify.agreement || '',
        pdf() { generateAgeVerificationPDF(this); },
    };

    return userData;
}

function AgeVerificationPage() {
    const { setHeader } = usePortal();
    const { refetch: refetchCounts } = usePendingCounts();
    const [tab, setTab] = useState<'PENDING' | 'REJECTED' | 'APPROVED'>('PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProfile, setSelectedProfile] = useState<I_ProfileCardProps | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Fetch all users (no limit) to ensure we get all age-verified users
    // Filter by ageVerify.status is done client-side since it's an embedded document
    const { users, loading, refetch } = useGetUsers(
        undefined,
        {
            sort: { createdAt: -1 },
            populate: ['ageVerify.preApproval', 'ageVerify.approvedBy'],
            pagination: false, // Get all users without pagination
        },
    );
    const { approveAgeVerify, rejectAgeVerify, loading: actionLoading } = useAgeVerification();

    const pendingUsers = users.filter(user => user.ageVerify?.status === 'PENDING');
    const approvedUsers = users.filter(user => user.ageVerify?.status === 'APPROVED');
    const rejectedUsers = users.filter(user => user.ageVerify?.status === 'REJECTED');

    const pendingProfiles = pendingUsers
        .map(transformUserToProfileCard)
        .filter((profile): profile is I_ProfileCardProps => profile !== null);

    const approvedProfiles = approvedUsers
        .map(transformApprovedUser)
        .filter((profile): profile is NonNullable<ReturnType<typeof transformApprovedUser>> => profile !== null);

    const filteredPendingProfiles = pendingProfiles.filter(profile =>
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const filteredApprovedProfiles = approvedProfiles.filter(profile =>
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const rejectedProfiles = rejectedUsers
        .map(transformUserToProfileCard)
        .filter((profile): profile is I_ProfileCardProps => profile !== null);

    const filteredRejectedProfiles = rejectedProfiles.filter(profile =>
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const today = new Date().toDateString();
    const approvedToday = approvedUsers.filter(user =>
        user.ageVerify?.approvedAt && new Date(user.ageVerify.approvedAt).toDateString() === today,
    ).length;

    const totalVerified = approvedUsers.length;
    const successRate = totalVerified > 0 ? ((totalVerified / (totalVerified + pendingUsers.length)) * 100).toFixed(1) : '0';

    const updatedStats = [
        { ...stats[0], value: pendingUsers.length },
        { ...stats[1], value: approvedToday },
        { ...stats[2], value: totalVerified },
        { ...stats[3], value: `${successRate}%` },
    ];

    useEffect(() => {
        setHeader({
            title: 'Age Verification Dashboard',
            description: 'Secure identity verification and age compliance management',
            icon: UserCheck,
        });
        return () => setHeader(null);
    }, [setHeader]);

    const handleApprove = async (profile: I_ProfileCardProps) => {
        try {
            await approveAgeVerify({ userId: profile.userId });
            refetch();
            refetchCounts();
        }
        catch (error) {
            console.error('Error approving age verification:', error);
        }
    };

    const handleReject = (profile: I_ProfileCardProps) => {
        setSelectedProfile(profile);
        setRejectModalOpen(true);
        setRejectReason('');
    };

    const handleRejectConfirm = async () => {
        if (!selectedProfile || !rejectReason.trim())
            return;

        try {
            await rejectAgeVerify({
                userId: selectedProfile.userId,
                reason: rejectReason,
            });
            setRejectModalOpen(false);
            setSelectedProfile(null);
            setRejectReason('');
            refetch();
            refetchCounts();
        }
        catch (error) {
            console.error('Error rejecting age verification:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading age verification data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {updatedStats.map((stat, index) => (
                    <div
                        key={stat.value}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <StatsCard {...stat} />
                    </div>
                ))}
            </div>
            {/* Search and Filter Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700 mb-6 animate-slide-in-right">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white/80 dark:bg-slate-700/80 border-gray-200 dark:border-slate-600 focus:border-primary dark:focus:border-primary focus:ring-primary/20 dark:focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700">
                            <Filter className="w-4 h-4" />
                            Filter
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700">
                            <Calendar className="w-4 h-4" />
                            Date Range
                        </Button>
                    </div>
                </div>
            </div>
            {/* Enhanced Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
                <Tabs value={tab} onValueChange={v => setTab(v as 'PENDING' | 'APPROVED')} className="w-full">
                    <div className="border-b border-border dark:border-slate-700 bg-muted/30 dark:bg-slate-700/30">
                        <TabsList className="bg-transparent border-0 p-0 h-auto">
                            <TabsTrigger
                                value="PENDING"
                                className="flex items-center gap-2 px-6 py-4 text-base data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20"
                            >
                                <Clock className="w-5 h-5" />
                                Pending Verification
                                <Badge variant="secondary" className="ml-2 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300">
                                    {filteredPendingProfiles.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="REJECTED"
                                className="flex items-center gap-2 px-6 py-4 text-base data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20"
                            >
                                <UserX className="w-5 h-5" />
                                Rejected
                                <Badge variant="secondary" className="ml-2 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300">
                                    {filteredRejectedProfiles.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="APPROVED"
                                className="flex items-center gap-2 px-6 py-4 text-base data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20"
                            >
                                <UserCheck className="w-5 h-5" />
                                Approved Users
                                <Badge variant="secondary" className="ml-2 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300">
                                    {filteredApprovedProfiles.length}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="PENDING" className="p-6">
                        {filteredPendingProfiles.length === 0
                            ? (
                                    <div className="text-center py-12">
                                        <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                                            No pending verifications
                                        </h3>
                                        <p className="text-muted-foreground">
                                            All verification requests have been processed
                                        </p>
                                    </div>
                                )
                            : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredPendingProfiles.map(profile => (
                                            <div key={profile.id} className="transform transition-all duration-300 hover:scale-105">
                                                <ProfileCard
                                                    {...profile}
                                                    onApprove={() => handleApprove(profile)}
                                                    onMessage={() => {}}
                                                    onReject={() => handleReject(profile)}
                                                    loading={actionLoading}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                    </TabsContent>

                    <TabsContent value="REJECTED" className="p-6">
                        {filteredRejectedProfiles.length === 0
                            ? (
                                    <div className="text-center py-12">
                                        <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                                            No rejected verifications
                                        </h3>
                                        <p className="text-muted-foreground">
                                            There are no rejected profiles
                                        </p>
                                    </div>
                                )
                            : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredRejectedProfiles.map(profile => (
                                            <div key={profile.id} className="transform transition-all duration-300 hover:scale-105">
                                                <ProfileCard
                                                    {...profile}
                                                    onApprove={() => handleApprove(profile)}
                                                    loading={actionLoading}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                    </TabsContent>

                    <TabsContent value="APPROVED" className="p-6">
                        <div className="overflow-hidden bg-white dark:bg-slate-700 rounded-lg border dark:border-slate-600">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    Profile Name
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    Approval Date & Time
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                                Approved By
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                                Age Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                                Verification Method
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                                Birth Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                                Agreement
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border dark:divide-slate-600">
                                        {filteredApprovedProfiles.map((user, index) => (
                                            <tr
                                                key={user.id}
                                                className="hover:bg-muted/50 dark:hover:bg-slate-600/50 transition-colors duration-200"
                                                style={{ animationDelay: `${index * 100}ms` }}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                                                            <UserCheck className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <span className="font-medium text-primary hover:underline cursor-pointer">
                                                            {user.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    <div className="space-y-1">
                                                        <div className="font-medium">{user.date}</div>
                                                        <div className="text-sm">{user.time}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                                                            <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        {user.approvedBy}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        18+ Verified
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4" />
                                                        {user.method}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    <div className="space-y-1">
                                                        <div>{user.birth}</div>
                                                        <div className="text-sm">
                                                            Age:
                                                            {' '}
                                                            <span className="font-medium">{user.age}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => user.pdf()}
                                                        className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors border-gray-200 dark:border-slate-600"
                                                        aria-label={`Download PDF for ${user.name}`}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download PDF
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
            {/* Reject & Delete Profile Modal */}
            <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent className="max-w-md w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-white/20 dark:border-slate-700/20">
                    <DialogTitle>
                        <span className="flex items-center gap-2 text-destructive">
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Reject Profile
                        </span>
                    </DialogTitle>
                    {selectedProfile && (
                        <>
                            <div className="mb-2">
                                <div>
                                    Profile:
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="font-bold block max-w-full truncate overflow-hidden text-ellipsis align-middle" style={{ verticalAlign: 'middle', display: 'inline-block', maxWidth: 320 }}>
                                                {selectedProfile.name}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {selectedProfile.name}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div>
                                    Age:
                                    <span className="font-bold">
                                        {selectedProfile.age}
                                        {' '}
                                        years
                                    </span>
                                </div>
                            </div>
                            <div className="mb-4 text-muted-foreground text-sm">
                                This will reject the verification. This action cannot be undone.
                            </div>
                            <div className="mb-2 font-semibold">Rejection Reason</div>
                            <textarea
                                className="w-full min-h-[80px] rounded-lg border border-gray-200 dark:border-slate-600 px-3 py-2 text-sm bg-white/80 dark:bg-slate-700/80 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary dark:focus:border-primary focus:ring-primary/20 dark:focus:ring-primary/20"
                                placeholder="Enter reason for rejection..."
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                            />
                        </>
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setRejectModalOpen(false)} className="border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700">
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectConfirm}
                            disabled={!rejectReason.trim() || actionLoading}
                        >
                            {actionLoading ? 'Rejecting...' : 'Rejected'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AgeVerificationPage;
