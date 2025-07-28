import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/utils/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // For navigation

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if the email exists in the `users` table
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", formData.email)
        .single();

      if (error || !user) {
        throw new Error("User with this email does not exist.");
      }

      // Navigate to the home page if the user exists
      navigate("/");
    } catch (err: any) {
      setError(err.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-sky-900">Login</h2>
        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>
          <Button onClick={handleLogin} disabled={loading} className="w-full">
            {loading ? "Checking..." : "Login"}
          </Button>
          <p className="text-sm text-center mt-4">
            Don't have an account?{" "}
            <span
              className="text-sky-600 cursor-pointer"
              onClick={() => navigate("/signup")}
            >
              Signup
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
