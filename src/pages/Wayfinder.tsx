import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const wayfinderSteps = [
  {
    id: 1,
    title: "Case Assessment",
    description: "Understand your legal situation and options",
    status: "current",
    duration: "15 min",
    tasks: [
      "Review case information questionnaire",
      "Gather relevant documents and evidence",
      "Consult with AI assistant for guidance",
    ],
  },
  {
    id: 2,
    title: "Document Preparation",
    description: "Gather and prepare required legal documents",
    status: "upcoming",
    duration: "2-3 hours",
  },
  {
    id: 3,
    title: "Court Filing",
    description: "Submit your documents to the court",
    status: "upcoming",
    duration: "1 hour",
  },
  {
    id: 4,
    title: "Service of Process",
    description: "Properly serve documents to other parties",
    status: "upcoming",
    duration: "1-2 weeks",
  },
  {
    id: 5,
    title: "Court Appearance",
    description: "Attend your scheduled court hearing",
    status: "upcoming",
    duration: "1-2 hours",
  },
];

const Wayfinder = () => {
  const navigate = useNavigate();
  const stepHandler = (stepId) => {
    if (stepId === 1) {
      navigate("/step1");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-primary">Wayfinder</h1>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">
              Your Legal Journey
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Follow this step-by-step guide to navigate your legal process with
              confidence. Each step includes resources, templates, and guidance.
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center space-x-8 mt-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-sm">Current Step</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-muted rounded-full"></div>
              <span className="text-sm">Upcoming</span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {wayfinderSteps.map((step, index) => (
            <Card
              key={step.id}
              className={`${
                step.status === "current" ? "ring-2 ring-primary" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {step.status === "completed" ? (
                      <CheckCircle className="w-8 h-8 text-success" />
                    ) : step.status === "current" ? (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {step.id}
                        </span>
                      </div>
                    ) : (
                      <Circle className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">
                          Step {step.id}: {step.title}
                        </h3>
                        {step.status === "current" && (
                          <Badge variant="default">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {step.duration}
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4">
                      {step.description}
                    </p>

                    {step.status === "current" && step.tasks && (
                      <div className="space-y-3">
                        <h4 className="font-medium">What you need to do:</h4>
                        <ul className="space-y-2">
                          {step.tasks.map((task, taskIndex) => (
                            <li
                              key={taskIndex}
                              className="flex items-start space-x-2"
                            >
                              <span className="text-primary">•</span>
                              <span className="text-sm">{task}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="flex space-x-3 mt-4">
                          <Button onClick={() => stepHandler(step.id)}>
                            Start Step
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                          <Button variant="outline">Get Help</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Wayfinder;
