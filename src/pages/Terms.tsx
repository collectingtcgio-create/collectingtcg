import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/20 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Button>
                </div>
            </header>

            {/* Content */}
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
                <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="prose prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing and using CollectingTCG ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            CollectingTCG is a platform for trading card game collectors to scan, organize, buy, sell, and trade cards. The Service includes card scanning, collection management, marketplace features, and community interaction tools.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            To use certain features of the Service, you must register for an account. You agree to:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                            <li>Provide accurate, current, and complete information during registration</li>
                            <li>Maintain the security of your password and account</li>
                            <li>Notify us immediately of any unauthorized use of your account</li>
                            <li>Be responsible for all activities that occur under your account</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">4. Marketplace Transactions</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            When buying or selling cards through our marketplace:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                            <li>Sellers are responsible for accurate descriptions and condition reporting</li>
                            <li>Buyers are responsible for reviewing listings before purchase</li>
                            <li>All sales are final unless otherwise stated by the seller</li>
                            <li>CollectingTCG is not responsible for disputes between buyers and sellers</li>
                            <li>We reserve the right to remove listings that violate our policies</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">5. User Content</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            You retain ownership of content you upload to the Service. By uploading content, you grant CollectingTCG a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content in connection with the Service.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            You agree not to upload content that is illegal, offensive, infringes on intellectual property rights, or violates these Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">6. Prohibited Activities</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            You agree not to:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                            <li>Use the Service for any illegal purpose</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Attempt to gain unauthorized access to the Service</li>
                            <li>Upload malicious code or viruses</li>
                            <li>Engage in fraudulent transactions</li>
                            <li>Scrape or harvest data from the Service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">7. Intellectual Property</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service and its original content, features, and functionality are owned by CollectingTCG and are protected by international copyright, trademark, and other intellectual property laws. Trading card images and related content are property of their respective owners.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">8. Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">9. Disclaimer of Warranties</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">10. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            In no event shall CollectingTCG be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">11. Changes to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have any questions about these Terms, please contact us through the Support button in the footer.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
