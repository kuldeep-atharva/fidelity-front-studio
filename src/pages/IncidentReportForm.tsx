import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/utils/supabaseClient";
import * as Dialog from '@radix-ui/react-dialog';
import axios from "axios";

const IncidentReportForm: React.FC = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    date_of_incident: "",
    type_of_incident: "",
    contact_phone: "",
    contact_email: "",
  });

  const [document, setDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocument(e.target.files[0]);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result as string;

        if (!result.startsWith("data:application/pdf;base64,")) {
          return reject(new Error("Invalid file format — must be a PDF."));
        }

        const base64 = result.split(",")[1];
        resolve(base64);
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file."));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
console.log("form", form)
    try {
      let base64Pdf = "";

      // 1. Convert document to Base64 if uploaded
      if (document) {
        base64Pdf = await convertFileToBase64(document);

        // const filePath = `documents/${Date.now()}-${document.name}`;
        // const { data: uploadData, error: uploadError } = await supabase.storage
        //   .from("incident-docs")
        //   .upload(filePath, document);

        // if (uploadError) {
        //   throw new Error(`Upload failed: ${uploadError.message}`);
        // }

        // const { data: publicUrlData } = supabase.storage
        //   .from("incident-docs")
        //   .getPublicUrl(filePath);

        // documentUrl = publicUrlData.publicUrl;
      }

      // 2. Insert all details into Supabase `cases` table
      const { error: insertError } = await supabase
        .from("cases")
        .insert([
          {
            case_number: `SF-2025-00${Math.floor(Math.random() * 1000)}`,
            first_name: form.firstName,
            last_name: form.lastName,
            date_of_incident: form.date_of_incident,
            type_of_incident: form.type_of_incident,
            contact_phone: form.contact_phone,
            contact_email: form.contact_email,
            pdf_url: base64Pdf,
            status: "New",
          },
        ]);

      if (insertError) {
        throw new Error(`Insert failed: ${insertError.message}`);
      }

      //Signcare API integration (commented out for now)
      // await axios.post(
      //   "https://uat-ext.signcare.io/api/v1/esign/request",
      //   {
      //     referenceId: "dixit1246515",
      //     skipVerificationCode: false,
      //     documentInfo: {
      //       name: "Rp test E",
      //       content: base64Pdf,
      //     },
      //     supportingDocuments: [],
      //     sequentialSigning: true,
      //     userInfo: [
      //       {
      //         name: "Gyandeep Chauhan",
      //         emailId: "rahul.patel@yopmail.com",
      //         userType: "Reviewer",
      //         signatureType: "Electronic",
      //         electronicOptions: null,
      //         aadhaarInfo: null,
      //         aadhaarOptions: null,
      //         expiryDate: null,
      //         emailReminderDays: null,
      //         mobileNo: "9638865899",
      //         order: 1,
      //         userReferenceId: "test123",
      //         signAppearance: 5,
      //         pageToBeSigned: null,
      //         pageNumber: null,
      //         pageCoordinates: [],
      //       },
      //       {
      //         name: "Rahul Patel",
      //         emailId: "dixit@atharvasystem.com",
      //         userType: "Signer",
      //         signatureType: "Electronic",
      //         electronicOptions: {
      //           canDraw: true,
      //           canType: true,
      //           canUpload: true,
      //           captureGPSLocation: false,
      //           capturePhoto: false,
      //         },
      //         aadhaarInfo: null,
      //         aadhaarOptions: null,
      //         expiryDate: null,
      //         emailReminderDays: null,
      //         mobileNo: "9638865899",
      //         order: 2,
      //         userReferenceId: "test123",
      //         signAppearance: 5,
      //         pageToBeSigned: null,
      //         pageNumber: null,
      //         pageCoordinates: [
      //           {
      //             pageNumber: 1,
      //             PDFCoordinates: [
      //               {
      //                 X1: "10",
      //                 X2: "120",
      //                 Y1: "722",
      //                 Y2: "40",
      //               },
      //             ],
      //           },
      //         ],
      //       },
      //     ],
      //     descriptionForInvitee: "eSign By RP",
      //     finalCopyRecipientsEmailId: "",
      //   },
      //   {
      //     headers: {
      //       "X-API-KEY": "LED3JHDbYgbmdl7fJfRRNk1xVgeAhbHO",
      //       "X-API-APP-ID": "191ba7c3-f508-4ed3-896d-6d1c8687e2e7",
      //     },
      //   }
      // );

      // alert("Incident report submitted successfully.");
      // navigate("/admin");
      
      setIsModalOpen(true)
      setForm({
        firstName: "",
        lastName: "",
        date_of_incident: "",
        type_of_incident: "",
        contact_phone: "",
        contact_email: "",
      });
      setDocument(null);
    } catch (error: any) {
      console.error("Submission Error:", error);
      alert(error.message || "An error occurred while submitting the form.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto mt-10 bg-white shadow-lg rounded-lg p-10">
        <h2 className="text-2xl font-bold text-center mb-4 text-sky-900">
          Incident Report Form
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Please complete all required fields to submit your incident report to
          the Superior Court of San Francisco County
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm mb-1 font-medium">
              First Name *
            </label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="w-full p-2 rounded bg-purple-100 border border-gray-300"
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">
              Last Name *
            </label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="w-full p-2 rounded bg-purple-100 border border-gray-300"
              placeholder="Enter your last name"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">
              Date of Incident *
            </label>
            <input
              type="date"
              name="date_of_incident"
              value={form.date_of_incident}
              onChange={handleChange}
              className="w-full p-2 rounded bg-purple-100 border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">
              Type of Incident *
            </label>
            <select
              name="type_of_incident"
              value={form.type_of_incident}
              onChange={handleChange}
              className="w-full p-2 rounded bg-purple-100 border border-gray-300"
            >
              <option value="">Select incident type</option>
              <option value="Theft">Theft</option>
              <option value="Assault">Assault</option>
              <option value="Harassment">Harassment</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">
              Contact Phone Number *
            </label>
            <input
              name="contact_phone"
              value={form.contact_phone}
              onChange={handleChange}
              className="w-full p-2 rounded bg-purple-100 border border-gray-300"
              placeholder="(415) 555-0123"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">
              Contact Email *
            </label>
            <input
              type="email"
              name="contact_email"
              value={form.contact_email}
              onChange={handleChange}
              className="w-full p-2 rounded bg-purple-100 border border-gray-300"
              placeholder="your.email@example.com"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1 font-medium">
              Upload Document
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full p-2 bg-purple-100 rounded border border-gray-300"
            />
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button onClick={() => navigate("/wayfinder")} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>

        <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <Dialog.Title className="text-xl font-bold text-sky-900 mb-2">
              Report Submitted Successfully
            </Dialog.Title>
            <Dialog.Description className="text-gray-600 mb-6">
              Your incident report has been received by the Superior Court of San Francisco County.
            </Dialog.Description>
            
            <div className="flex justify-end">
              <Dialog.Close asChild>
                <Button onClick={() => navigate("/wayfinder")}>
                  Proceed
                </Button>
              </Dialog.Close>
            </div>
            
            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      </div>
    </Layout>
  );
};

export default IncidentReportForm;
