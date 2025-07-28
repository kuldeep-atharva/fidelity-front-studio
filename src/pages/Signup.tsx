import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/utils/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Signup = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "Signer", // Default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // For navigation

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async () => {
    setLoading(true);
    setError(null);

    try {
      // // Create user in Supabase Auth
      // const { data: authData, error: authError } = await supabase.auth.signUp({
      //   email: formData.email,
      //   password: formData.password,
      //   options: {
      //     emailRedirectTo: null, // Skip email verification
      //   },
      // });

      // if (authError) throw authError;

      // Insert user into the `users` table
      const { error: insertError } = await supabase.from("users").insert([
        {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
        },
      ]);

      if (insertError) throw insertError;

      // Redirect to login page after successful signup
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-sky-900">Signup</h2>
        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <Input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </div>
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
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Select
              defaultValue={formData.role}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Reviewer">Reviewer</SelectItem>
                <SelectItem value="Signer">Signer</SelectItem>
                <SelectItem value="Approver">Approver</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSignup} disabled={loading} className="w-full">
            {loading ? "Signing up..." : "Signup"}
          </Button>
          <p className="text-sm text-center mt-4">
            Already have an account?{" "}
            <span
              className="text-sky-600 cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
