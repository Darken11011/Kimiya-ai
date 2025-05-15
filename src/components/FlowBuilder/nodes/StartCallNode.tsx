
import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { initiateCall, defaultTwilioConfig } from '../../../services/twilioService';
import { StartCallNodeData } from '../../../types/flowTypes';

const StartCallNode: React.FC<NodeProps<StartCallNodeData>> = ({ data }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [isCallInProgress, setIsCallInProgress] = useState(false);

  const handleCallNow = async () => {
    if (!data.phoneNumber) {
      alert("Please enter a phone number to call");
      return;
    }

    setIsCallInProgress(true);

    try {
      const config = {
        accountSid: data.accountSid || defaultTwilioConfig.accountSid,
        authToken: data.authToken || defaultTwilioConfig.authToken,
        fromNumber: data.fromNumber || defaultTwilioConfig.fromNumber
      };

      await initiateCall(data.phoneNumber, "current-workflow", config);
    } finally {
      setIsCallInProgress(false);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onChange) {
      data.onChange({ phoneNumber: e.target.value });
    }
  };

  const handleAccountSidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onChange) {
      data.onChange({ accountSid: e.target.value });
    }
  };

  const handleAuthTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onChange) {
      data.onChange({ authToken: e.target.value });
    }
  };

  const handleFromNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onChange) {
      data.onChange({ fromNumber: e.target.value });
    }
  };

  return (
    <div className="rounded-md border border-gray-300 bg-white p-4 shadow-md">
      <div className="flex items-center justify-center mb-2">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.908.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </div>
      </div>
      <div className="text-center font-medium">Start Call</div>
      
      <div className="mt-3">
        <input
          type="text"
          placeholder="Phone number to call"
          value={data.phoneNumber || ""}
          onChange={handlePhoneNumberChange}
          className="w-full p-1 text-xs border rounded"
        />
      </div>
      
      <div className="mt-2 flex justify-between">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs text-blue-600 underline"
        >
          {showConfig ? "Hide Twilio Config" : "Twilio Config"}
        </button>
        
        <button
          onClick={handleCallNow}
          disabled={isCallInProgress || !data.phoneNumber}
          className={`text-xs px-2 py-1 rounded ${
            isCallInProgress || !data.phoneNumber
              ? "bg-gray-300 text-gray-500"
              : "bg-green-500 text-white"
          }`}
        >
          {isCallInProgress ? "Calling..." : "Call Now"}
        </button>
      </div>
      
      {showConfig && (
        <div className="mt-3 border-t pt-2">
          <div className="text-xs font-medium mb-1">Twilio Configuration</div>
          <input
            type="text"
            placeholder="Account SID"
            value={data.accountSid || defaultTwilioConfig.accountSid}
            onChange={handleAccountSidChange}
            className="w-full p-1 text-xs border rounded mb-1"
          />
          <input
            type="password"
            placeholder="Auth Token"
            value={data.authToken || defaultTwilioConfig.authToken}
            onChange={handleAuthTokenChange}
            className="w-full p-1 text-xs border rounded mb-1"
          />
          <input
            type="text"
            placeholder="From Number"
            value={data.fromNumber || defaultTwilioConfig.fromNumber}
            onChange={handleFromNumberChange}
            className="w-full p-1 text-xs border rounded"
          />
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        className="w-3 h-3 bottom-0 bg-blue-500"
      />
    </div>
  );
};

export default StartCallNode;
