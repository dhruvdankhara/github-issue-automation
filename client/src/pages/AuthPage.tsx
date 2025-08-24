import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { signIn, signUp, clearError } from "../store/slices/authSlice";
import { Button } from "../../../client/src/components/ui/button";
import { Input } from "../../../client/src/components/ui/input";
import { Label } from "../../../client/src/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../client/src/components/ui/card";
import { Github, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  const { loading, error } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Clear Redux error when component mounts or mode changes
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch, isLogin]);

  // Email validation
  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  }, []);

  // Password validation
  const validatePassword = useCallback(
    (password: string): string | undefined => {
      if (!password) return "Password is required";
      if (password.length < 6)
        return "Password must be at least 6 characters long";
      if (!isLogin && password.length < 8)
        return "Password should be at least 8 characters for better security";
      return undefined;
    },
    [isLogin]
  );

  // Confirm password validation
  const validateConfirmPassword = useCallback(
    (confirmPassword: string, password: string): string | undefined => {
      if (!isLogin) {
        if (!confirmPassword) return "Please confirm your password";
        if (confirmPassword !== password) return "Passwords do not match";
      }
      return undefined;
    },
    [isLogin]
  );

  // Real-time validation
  useEffect(() => {
    const errors: typeof validationErrors = {};

    if (touched.email) {
      errors.email = validateEmail(email);
    }

    if (touched.password) {
      errors.password = validatePassword(password);
    }

    if (touched.confirmPassword && !isLogin) {
      errors.confirmPassword = validateConfirmPassword(
        confirmPassword,
        password
      );
    }

    setValidationErrors(errors);
  }, [
    email,
    password,
    confirmPassword,
    touched,
    isLogin,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
  ]);

  // Handle field blur for validation
  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Get user-friendly error message
  const getUserFriendlyError = (error: string): string => {
    if (error.includes("Invalid login credentials")) {
      return "Invalid email or password. Please check your credentials and try again.";
    }
    if (error.includes("Email not confirmed")) {
      return "Please check your email and click the confirmation link before signing in.";
    }
    if (error.includes("User already registered")) {
      return "An account with this email already exists. Try signing in instead.";
    }
    if (error.includes("Password should be at least")) {
      return "Password must be at least 6 characters long.";
    }
    if (error.includes("Email rate limit exceeded")) {
      return "Too many requests. Please wait a moment before trying again.";
    }
    if (error.includes("signup disabled")) {
      return "New registrations are currently disabled. Please contact support.";
    }
    // Return original error if no specific mapping found
    return error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched for validation
    setTouched({
      email: true,
      password: true,
      confirmPassword: !isLogin,
    });

    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = !isLogin
      ? validateConfirmPassword(confirmPassword, password)
      : undefined;

    if (emailError || passwordError || confirmPasswordError) {
      if (emailError) toast.error(emailError);
      else if (passwordError) toast.error(passwordError);
      else if (confirmPasswordError) toast.error(confirmPasswordError);
      return;
    }

    try {
      if (isLogin) {
        await dispatch(signIn({ email: email.trim(), password })).unwrap();
        toast.success("Successfully signed in!");
        navigate("/dashboard");
      } else {
        const result = await dispatch(
          signUp({ email: email.trim(), password })
        ).unwrap();

        if (result) {
          toast.success(
            "Account created successfully! Please check your email for verification."
          );
          // If user is created but needs email confirmation, show appropriate message
          if (!result.email_confirmed_at) {
            toast.info(
              "Please click the confirmation link in your email before signing in.",
              {
                duration: 6000,
              }
            );
          }
        } else {
          toast.success(
            "Please check your email for verification instructions."
          );
        }

        // Don't navigate immediately, let user confirm email first
        // navigate("/dashboard");
      }
    } catch (error) {
      console.error("Auth error:", error);
      const friendlyError = getUserFriendlyError(error as string);
      toast.error(friendlyError);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    dispatch(clearError());
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setTouched({});
    setValidationErrors({});
  };

  // Check if form is valid
  const isFormValid = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = !isLogin
      ? validateConfirmPassword(confirmPassword, password)
      : undefined;

    return !emailError && !passwordError && !confirmPasswordError;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Github className="h-12 w-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Issue Tracker</h1>
          <p className="text-gray-600 mt-2">
            Track and manage GitHub issues across your repositories
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? "Sign In" : "Create Account"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Welcome back! Please sign in to your account."
                : "Create a new account to get started."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={`pl-10 ${
                      touched.email && validationErrors.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    autoComplete="email"
                    aria-describedby={
                      touched.email && validationErrors.email
                        ? "email-error"
                        : undefined
                    }
                  />
                  {touched.email && validationErrors.email && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
                {touched.email && validationErrors.email && (
                  <p id="email-error" className="text-sm text-red-600">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur("password")}
                    className={`pl-10 pr-10 ${
                      touched.password && validationErrors.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    aria-describedby={
                      touched.password && validationErrors.password
                        ? "password-error"
                        : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                  {touched.password && validationErrors.password && (
                    <div className="absolute inset-y-0 right-10 flex items-center pr-3">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
                {touched.password && validationErrors.password && (
                  <p id="password-error" className="text-sm text-red-600">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => handleBlur("confirmPassword")}
                      className={`pl-10 pr-10 ${
                        touched.confirmPassword &&
                        validationErrors.confirmPassword
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                      autoComplete="new-password"
                      aria-describedby={
                        touched.confirmPassword &&
                        validationErrors.confirmPassword
                          ? "confirm-password-error"
                          : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                    {touched.confirmPassword &&
                      validationErrors.confirmPassword && (
                        <div className="absolute inset-y-0 right-10 flex items-center pr-3">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                  </div>
                  {touched.confirmPassword &&
                    validationErrors.confirmPassword && (
                      <p
                        id="confirm-password-error"
                        className="text-sm text-red-600"
                      >
                        {validationErrors.confirmPassword}
                      </p>
                    )}
                </div>
              )}

              {error && (
                <div className="flex items-start space-x-2 text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Authentication Error</p>
                    <p>{getUserFriendlyError(error)}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !isFormValid()}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </span>
                  </div>
                ) : (
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
                <button
                  onClick={toggleMode}
                  className="ml-1 font-medium text-indigo-600 hover:text-indigo-500"
                  disabled={loading}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            By {isLogin ? "signing in" : "signing up"}, you agree to our{" "}
            <Link to="#" className="underline hover:text-gray-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="#" className="underline hover:text-gray-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
