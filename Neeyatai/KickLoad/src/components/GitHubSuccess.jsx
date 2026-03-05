import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const GithubSuccessPage = () => {
  const [validAccess, setValidAccess] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token && !sessionStorage.getItem("github_success_token")) {
      sessionStorage.setItem("github_success_token", token);
      setValidAccess(true);

      // Optional: send token back to main window
      if (window.opener) {
        window.opener.postMessage(
          { type: "GITHUB_CONNECTED", token },
          "https://kickload.neeyatai.com"
        );
      }

      // Auto-close popup after 4 seconds
      setTimeout(() => {
        window.close();
      }, 4000);
    } else if (sessionStorage.getItem("github_success_token")) {
      setValidAccess(true);
      setTimeout(() => {
        window.close();
      }, 4000);
    } else {
      setValidAccess(false);
    }
  }, [searchParams]);

  if (!validAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-[50%] text-center">
          <div className="flex justify-center mb-6">
            <AlertTriangle size={56} className="text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 text-base">
            You cannot access this page directly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-[50%] max-w-md text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle2 size={56} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          GitHub Connected!
        </h2>
        <p className="text-gray-600 text-base mb-6">
          Your GitHub account has been successfully linked with KickLoad.
        </p>
        <p className="text-sm text-gray-400">This window will close in 4 seconds...</p>
      </div>
    </div>
  );
};

export default GithubSuccessPage;