import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/utils/supabaseClient";
import * as Dialog from "@radix-ui/react-dialog";
import FinalSubmissionPdf from "./FinalSubmissionPdf";
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

  const [documents, setDocuments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Filter only PDF files
      const pdfFiles = newFiles.filter(
        (file) => file.type === "application/pdf"
      );

      if (pdfFiles.length !== newFiles.length) {
        setValidationError(
          "Only PDF files are allowed. Non-PDF files were filtered out."
        );
      } else {
        setValidationError(null);
      }

      setDocuments((prev) => [...prev, ...pdfFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setDocuments((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleFinalSubmit = async (pdfBase64: string) => {
    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("cases").insert([
        {
          case_number: `SF-2025-00${Math.floor(Math.random() * 1000)}`,
          first_name: form.firstName,
          last_name: form.lastName,
          date_of_incident: form.date_of_incident,
          type_of_incident: form.type_of_incident,
          contact_phone: form.contact_phone,
          contact_email: form.contact_email,
          pdf_url: pdfBase64,
          status: "New",
        },
      ]);
      if (insertError) throw new Error(insertError.message);

      //Signcare API integration (commented out for now)
      await axios.post(
        "https://uat-ext.signcare.io/api/v1/esign/request",
        {
          referenceId: `CASE-0${Math.floor(Math.random() * 1000)}`,
          skipVerificationCode: false,
          documentInfo: {
            name: "Rp test E",
            content: pdfBase64,
          },
          supportingDocuments: [],
          sequentialSigning: true,
          userInfo: [
            {
              name: "Gyandeep Chauhan",
              emailId: "rahul.patel@yopmail.com",
              userType: "Reviewer",
              signatureType: "Electronic",
              electronicOptions: null,
              aadhaarInfo: null,
              aadhaarOptions: null,
              expiryDate: null,
              emailReminderDays: null,
              mobileNo: "9638865899",
              order: 1,
              userReferenceId: "test123",
              signAppearance: 5,
              pageToBeSigned: null,
              pageNumber: null,
              pageCoordinates: [],
            },
            {
              name: "Rahul Patel",
              emailId: "dixit@atharvasystem.com",
              userType: "Signer",
              signatureType: "Electronic",
              electronicOptions: {
                canDraw: true,
                canType: true,
                canUpload: true,
                captureGPSLocation: false,
                capturePhoto: false,
              },
              aadhaarInfo: null,
              aadhaarOptions: null,
              expiryDate: null,
              emailReminderDays: null,
              mobileNo: "9638865899",
              order: 2,
              userReferenceId: "test123",
              signAppearance: 5,
              pageToBeSigned: null,
              pageNumber: null,
              pageCoordinates: [
                {
                  pageNumber: 1,
                  PDFCoordinates: [
                    {
                      X1: "10",
                      X2: "120",
                      Y1: "722",
                      Y2: "40",
                    },
                  ],
                },
              ],
            },
          ],
          descriptionForInvitee: "eSign By RP",
          finalCopyRecipientsEmailId: "",
        },
        {
          headers: {
            "X-API-KEY": "LED3JHDbYgbmdl7fJfRRNk1xVgeAhbHO",
            "X-API-APP-ID": "191ba7c3-f508-4ed3-896d-6d1c8687e2e7",
          },
        }
      );

      setIsModalOpen(true);
      setForm({
        firstName: "",
        lastName: "",
        date_of_incident: "",
        type_of_incident: "",
        contact_phone: "",
        contact_email: "",
      });
      setDocuments([]);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const validateAndPreview = () => {
    // Simple required field validation
    if (
      !form.firstName ||
      !form.lastName ||
      !form.date_of_incident ||
      !form.type_of_incident ||
      !form.contact_phone ||
      !form.contact_email
    ) {
      setValidationError("Please fill all required fields before submitting.");
      return;
    }

    setValidationError(null);
    setFormData(form);
    setUploadedFiles(documents);
    setPdfOpen(true);
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
          {/* Fields */}
          {["firstName", "lastName", "contact_phone", "contact_email"].map(
            (field, i) => (
              <div key={field}>
                <label className="block text-sm mb-1 font-medium capitalize">
                  {field.replace("_", " ")} *
                </label>
                <input
                  name={field}
                  value={(form as any)[field]}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-purple-100 border border-gray-300"
                  placeholder={`Enter ${field.replace("_", " ")}`}
                />
              </div>
            )
          )}
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
          <div className="md:col-span-2">
            <label className="block text-sm mb-1 font-medium">
              Upload Documents (PDF only)
            </label>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              className="w-full p-2 bg-purple-100 rounded border border-gray-300"
            />
            {documents.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-2">
                  Selected files ({documents.length}):
                </p>
                <div className="space-y-2">
                  {documents.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {validationError && (
          <p className="text-red-600 text-sm mt-4">{validationError}</p>
        )}

        <div className="flex justify-between mt-8">
          <Button onClick={() => navigate("/wayfinder")} variant="outline">
            Cancel
          </Button>
          <Button onClick={validateAndPreview} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>

        {/* PDF Modal */}
        <FinalSubmissionPdf
          open={pdfOpen}
          onOpenChange={setPdfOpen}
          formData={formData}
          uploadedFiles={uploadedFiles}
          onConfirm={async (pdfBase64) => {
            setPdfOpen(false);
            await handleFinalSubmit(pdfBase64);
          }}
        />

        {/* Success Modal */}
        <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <Dialog.Title className="text-xl font-bold text-sky-900 mb-2">
                Report Submitted Successfully
              </Dialog.Title>
              <Dialog.Description className="text-gray-600 mb-6">
                Your incident report has been received by the Superior Court of
                San Francisco County.
              </Dialog.Description>
              <div className="flex justify-end">
                <Dialog.Close asChild>
                  <Button onClick={() => navigate("/wayfinder")}>
                    Proceed
                  </Button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </Layout>
  );
};

export default IncidentReportForm;
