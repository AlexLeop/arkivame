
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArkivameLogo } from '@/components/ui/arkivame-logo';
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';

const PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: '$29',
    description: 'Perfect for small teams',
    features: ['Up to 25 users', 'Thread capture', 'Basic search', 'Email support']
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    price: '$59',
    description: 'For growing organizations',
    features: ['Unlimited users', 'Advanced analytics', 'Integrations', 'Priority support']
  }
];

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    plan: 'STARTER' as 'STARTER' | 'BUSINESS',
    acceptTerms: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  
  const router = useRouter();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An error occurred during signup');
        return;
      }

      setSuccess(true);
      setRedirectUrl(data.redirectUrl);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(data.redirectUrl);
      }, 3000);

    } catch (error) {
      console.error('Signup error:', error);
      setError('An error occurred during signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            </motion.div>
            <h2 className="text-2xl font-bold text-primary mb-2">Account Created!</h2>
            <p className="text-muted-foreground mb-4">
              Your Arkivame organization has been successfully created.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting you to sign in...
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={redirectUrl}>Continue to Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-8">
            <ArkivameLogo size="lg" />
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold text-primary mb-2">Start your 14-day free trial</h1>
            <p className="text-muted-foreground">
              Transform your team conversations into lasting knowledge
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Create your account</h2>
                <Link 
                  href="/"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {/* Plan Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Choose your plan</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PLANS.map((plan) => (
                      <div
                        key={plan.id}
                        className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                          formData.plan === plan.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleInputChange('plan', plan.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{plan.name}</h3>
                            <p className="text-2xl font-bold text-primary">{plan.price}/month</p>
                            <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                            <ul className="text-xs space-y-1">
                              {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center">
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Acme Corp"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a secure password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => handleInputChange('acceptTerms', !!checked)}
                  />
                  <Label htmlFor="acceptTerms" className="text-sm">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !formData.acceptTerms}
                  size="lg"
                >
                  {isLoading ? 'Creating Account...' : 'Start Free Trial'}
                </Button>
                
                <div className="text-sm text-center text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
