import React, { useState, useEffect } from 'react';
import { Upload, Users, Calendar, Download, RefreshCw, Save, AlertCircle } from 'lucide-react';

const MentorshipDashboard = () => {
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [gdGroups, setGdGroups] = useState([]);
  const [selectedView, setSelectedView] = useState('upload');
  const [selectedSpoc, setSelectedSpoc] = useState('all');
  const [showInstructions, setShowInstructions] = useState(true);

  const DATES = ['2025-10-16', '2025-10-17', '2025-10-18', '2025-10-19'];
  const SLOTS = {
    afternoon: ['12:00-12:30', '12:30-13:00', '13:00-13:30', '13:30-14:00', '14:00-14:30', '14:30-15:00', '15:00-15:30', '15:30-16:00'],
    evening: ['17:00-17:30', '17:30-18:00', '18:00-18:30', '18:30-19:00', '19:00-19:30', '19:30-20:00', '20:00-20:30', '20:30-21:00']
  };

  const SPOCS = [
    'ADITYA SINGH', 'ARNAV JOSHI', 'BASIL RATHI', 'DEV PAHARIA', 'DIVYAANSH MEHTA',
    'JATIN', 'JAY PRATAP SINGH', 'KHUSHI SHARDA', 'LAKSHYA CHAUBEY', 'MOHAMED AMEEN',
    'RAHUL MALIK', 'RANISHKA', 'SHIBANEE RP', 'SIDHANT DADWAL', 'VAIBHAV VERMA'
  ];

  const GD_TOPICS = [
    'AI and Job Displacement', 'Remote Work Culture', 'Sustainable Business Practices',
    'Startup vs Corporate Career', 'Digital Privacy Rights', 'Global Trade Policies',
    'Climate Change Business Impact', 'Future of Education', 'Healthcare Innovation',
    'Financial Technology Revolution', 'Gig Economy Future', 'ESG Investing',
    'Blockchain in Business', 'Mental Health at Work', 'Indian Manufacturing Growth'
  ];

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const handleStudentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = parseCSV(event.target.result);
        const formattedStudents = data.map((row, idx) => ({
          id: row.id || row['student id'] || `STU${String(idx + 1).padStart(3, '0')}`,
          name: row.name || row['student name'] || `Student ${idx + 1}`,
          email: row.email || '',
          phone: row.phone || row.contact || '',
          spoc: row.spoc || SPOCS[Math.floor(idx / 12)]
        }));
        setStudents(formattedStudents);
        alert(`Loaded ${formattedStudents.length} students!`);
      };
      reader.readAsText(file);
    }
  };

  const handleMentorUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = parseCSV(event.target.result);
        const formattedMentors = data.map((row, idx) => ({
          id: row.id || row['mentor id'] || `MEN${String(idx + 1).padStart(3, '0')}`,
          name: row.name || row['mentor name'] || `Mentor ${idx + 1}`,
          email: row.email || '',
          phone: row.phone || row.contact || '',
          availability: row.availability ? row.availability.split(';') : DATES.slice(0, 2),
          availableSlots: row.slots ? row.slots.split(';') : ['afternoon', 'evening']
        }));
        setMentors(formattedMentors);
        alert(`Loaded ${formattedMentors.length} mentors!`);
      };
      reader.readAsText(file);
    }
  };

  const generateAssignments = () => {
    if (students.length === 0 || mentors.length === 0) {
      alert('Please upload both student and mentor data first!');
      return;
    }

    const newAssignments = [];
    const mentorSchedule = {};
    const studentSchedule = {};

    mentors.forEach(m => {
      mentorSchedule[m.id] = {};
      m.availability.forEach(date => {
        mentorSchedule[m.id][date] = {
          afternoon: Array(8).fill(null),
          evening: Array(8).fill(null)
        };
      });
    });

    // Assign PIs
    students.forEach(student => {
      const assignedMentors = [];
      let piCount = 0;

      for (let attempt = 0; attempt < 200 && piCount < 2; attempt++) {
        const mentor = mentors[Math.floor(Math.random() * mentors.length)];
        
        if (assignedMentors.includes(mentor.id)) continue;
        
        const availDate = mentor.availability[Math.floor(Math.random() * mentor.availability.length)];
        const slotType = mentor.availableSlots[Math.floor(Math.random() * mentor.availableSlots.length)];
        const slotIndex = Math.floor(Math.random() * 8);
        
        if (mentorSchedule[mentor.id][availDate] && mentorSchedule[mentor.id][availDate][slotType][slotIndex] === null) {
          const slot = SLOTS[slotType][slotIndex];
          
          if (!studentSchedule[student.id]) {
            studentSchedule[student.id] = {};
          }
          
          const scheduleKey = `${availDate}-${slot}`;
          if (!studentSchedule[student.id][scheduleKey]) {
            mentorSchedule[mentor.id][availDate][slotType][slotIndex] = {
              studentId: student.id,
              type: 'PI'
            };
            
            newAssignments.push({
              id: `ASSIGN-${newAssignments.length + 1}`,
              studentId: student.id,
              studentName: student.name,
              mentorId: mentor.id,
              mentorName: mentor.name,
              type: 'PI',
              piNumber: piCount + 1,
              date: availDate,
              slot: slot,
              slotType: slotType,
              zoomLink: '',
              status: 'scheduled'
            });
            
            studentSchedule[student.id][scheduleKey] = true;
            assignedMentors.push(mentor.id);
            piCount++;
          }
        }
      }
    });

    // Generate GD groups
    const newGdGroups = [];
    const studentsPerGd = 6;
    const numGroups = Math.ceil(students.length / studentsPerGd);

    for (let i = 0; i < numGroups; i++) {
      const groupStudents = students.slice(i * studentsPerGd, (i + 1) * studentsPerGd);
      const mentor = mentors[i % mentors.length];
      const date = DATES[i % DATES.length];
      const slotType = i % 2 === 0 ? 'afternoon' : 'evening';
      const slot = SLOTS[slotType][Math.floor(Math.random() * 8)];

      newGdGroups.push({
        id: `GD-${String(i + 1).padStart(2, '0')}`,
        topic: GD_TOPICS[i % GD_TOPICS.length],
        mentorId: mentor.id,
        mentorName: mentor.name,
        date: date,
        slot: slot,
        students: groupStudents.map(s => ({
          id: s.id,
          name: s.name,
          status: 'pending'
        })),
        zoomLink: ''
      });

      groupStudents.forEach(student => {
        newAssignments.push({
          id: `ASSIGN-GD-${i}-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          mentorId: mentor.id,
          mentorName: mentor.name,
          type: 'GD',
          gdGroupId: `GD-${String(i + 1).padStart(2, '0')}`,
          date: date,
          slot: slot,
          slotType: slotType,
          zoomLink: '',
          status: 'scheduled'
        });
      });
    }

    setAssignments(newAssignments);
    setGdGroups(newGdGroups);
    setSelectedView('dashboard');
    alert('Schedule generated successfully!');
  };

  const getMentorStats = () => {
    const stats = {};
    mentors.forEach(m => {
      stats[m.id] = {
        name: m.name,
        piCount: 0,
        gdCount: 0,
        totalMinutes: 0
      };
    });

    assignments.forEach(a => {
      if (stats[a.mentorId]) {
        if (a.type === 'PI') {
          stats[a.mentorId].piCount++;
          stats[a.mentorId].totalMinutes += 30;
        } else if (a.type === 'GD') {
          stats[a.mentorId].totalMinutes += 5;
        }
      }
    });

    return Object.values(stats).sort((a, b) => b.totalMinutes - a.totalMinutes);
  };

  const exportToCSV = () => {
    const headers = ['Student ID', 'Student Name', 'Mentor ID', 'Mentor Name', 'Type', 'Date', 'Slot', 'Zoom Link', 'Status'];
    const rows = assignments.map(a => [
      a.studentId, a.studentName, a.mentorId, a.mentorName, 
      a.type, a.date, a.slot, a.zoomLink, a.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mentorship_schedule.csv';
    link.click();
  };

  const downloadSampleCSV = (type) => {
    let content = '';
    if (type === 'students') {
      content = `id,name,email,phone,spoc\nSTU001,John Doe,john@iift.edu,+91-9876543210,ADITYA SINGH\nSTU002,Jane Smith,jane@iift.edu,+91-9876543211,ADITYA SINGH`;
    } else {
      content = `id,name,email,phone,availability,slots\nMEN001,Dr. Kumar,kumar@company.com,+91-9876543210,2025-10-16;2025-10-17,afternoon;evening\nMEN002,Ms. Sharma,sharma@company.com,+91-9876543211,2025-10-16;2025-10-18,afternoon`;
    }
    
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sample_${type}.csv`;
    link.click();
  };

  const updateGdStatus = (gdId, studentId, newStatus) => {
    setGdGroups(prev => prev.map(gd => {
      if (gd.id === gdId) {
        return {
          ...gd,
          students: gd.students.map(s => 
            s.id === studentId ? { ...s, status: newStatus } : s
          )
        };
      }
      return gd;
    }));
  };

  const updateZoomLink = (assignmentId, newLink) => {
    setAssignments(prev => prev.map(a => 
      a.id === assignmentId ? { ...a, zoomLink: newLink } : a
    ));
  };

  const filteredStudents = selectedSpoc === 'all' 
    ? students 
    : students.filter(s => s.spoc === selectedSpoc);

  const filteredAssignments = selectedSpoc === 'all'
    ? assignments
    : assignments.filter(a => {
        const student = students.find(s => s.id === a.studentId);
        return student && student.spoc === selectedSpoc;
      });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-indigo-900">IIFT Career Mentorship Dashboard</h1>
              <p className="text-gray-600">October 16-19, 2025</p>
            </div>
            {assignments.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Download size={20} />
                Export Schedule
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users size={24} className="text-blue-600" />
                <span className="font-semibold">Students</span>
              </div>
              <p className="text-3xl font-bold text-blue-700">{students.length}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users size={24} className="text-green-600" />
                <span className="font-semibold">Mentors</span>
              </div>
              <p className="text-3xl font-bold text-green-700">{mentors.length}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={24} className="text-purple-600" />
                <span className="font-semibold">PI Sessions</span>
              </div>
              <p className="text-3xl font-bold text-purple-700">
                {assignments.filter(a => a.type === 'PI').length}
              </p>
            </div>
            <div className="bg-orange-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users size={24} className="text-orange-600" />
                <span className="font-semibold">GD Groups</span>
              </div>
              <p className="text-3xl font-bold text-orange-700">{gdGroups.length}</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setSelectedView('upload')}
              className={`px-4 py-2 rounded-lg ${selectedView === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
            >
              <Upload className="inline mr-2" size={16} />
              Upload Data
            </button>
            <button
              onClick={() => setSelectedView('dashboard')}
              className={`px-4 py-2 rounded-lg ${selectedView === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              disabled={assignments.length === 0}
            >
              Dashboard
            </button>
            <button
              onClick={() => setSelectedView('schedule')}
              className={`px-4 py-2 rounded-lg ${selectedView === 'schedule' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              disabled={assignments.length === 0}
            >
              Schedule
            </button>
            <button
              onClick={() => setSelectedView('gd')}
              className={`px-4 py-2 rounded-lg ${selectedView === 'gd' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              disabled={gdGroups.length === 0}
            >
              GD Tracker
            </button>
            <button
              onClick={() => setSelectedView('mentors')}
              className={`px-4 py-2 rounded-lg ${selectedView === 'mentors' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              disabled={assignments.length === 0}
            >
              Mentor Utilization
            </button>
          </div>

          {assignments.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Filter by SPOC:</label>
              <select
                value={selectedSpoc}
                onChange={(e) => setSelectedSpoc(e.target.value)}
                className="border rounded px-3 py-2 w-64"
              >
                <option value="all">All SPOCs</option>
                {SPOCS.map(spoc => (
                  <option key={spoc} value={spoc}>{spoc}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {selectedView === 'upload' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Upload Data</h2>
            
            {showInstructions && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="text-blue-500 mr-3 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold mb-2">CSV Format Instructions:</h3>
                    <p className="text-sm mb-2"><strong>Students CSV:</strong> id, name, email, phone, spoc</p>
                    <p className="text-sm mb-2"><strong>Mentors CSV:</strong> id, name, email, phone, availability, slots</p>
                    <p className="text-sm mb-2"><strong>Availability format:</strong> Dates separated by semicolons (e.g., 2025-10-16;2025-10-17)</p>
                    <p className="text-sm mb-2"><strong>Slots format:</strong> afternoon;evening or just afternoon or evening</p>
                    <button onClick={() => setShowInstructions(false)} className="text-blue-600 text-sm underline mt-2">
                      Hide instructions
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Upload Students</h3>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleStudentUpload}
                  className="mb-4 w-full"
                />
                <button
                  onClick={() => downloadSampleCSV('students')}
                  className="text-blue-600 text-sm underline"
                >
                  Download sample students CSV
                </button>
                {students.length > 0 && (
                  <p className="text-green-600 mt-2">✓ {students.length} students loaded</p>
                )}
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Upload Mentors</h3>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleMentorUpload}
                  className="mb-4 w-full"
                />
                <button
                  onClick={() => downloadSampleCSV('mentors')}
                  className="text-blue-600 text-sm underline"
                >
                  Download sample mentors CSV
                </button>
                {mentors.length > 0 && (
                  <p className="text-green-600 mt-2">✓ {mentors.length} mentors loaded</p>
                )}
              </div>
            </div>

            {students.length > 0 && mentors.length > 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={generateAssignments}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 flex items-center gap-2 mx-auto"
                >
                  <RefreshCw size={20} />
                  Generate Schedule
                </button>
              </div>
            )}
          </div>
        )}

        {selectedView === 'dashboard' && assignments.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Quick Overview</h2>
            <div className="grid grid-cols-4 gap-4">
              {DATES.map(date => {
                const dateAssignments = filteredAssignments.filter(a => a.date === date);
                return (
                  <div key={date} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </h3>
                    <p className="text-sm text-gray-600">Sessions: {dateAssignments.length}</p>
                    <p className="text-sm text-gray-600">
                      PIs: {dateAssignments.filter(a => a.type === 'PI').length}
                    </p>
                    <p className="text-sm text-gray-600">
                      GDs: {new Set(dateAssignments.filter(a => a.type === 'GD').map(a => a.gdGroupId)).size}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedView === 'schedule' && assignments.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Master Schedule</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-100">
                    <th className="p-2 text-left">Student</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Mentor</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Slot</th>
                    <th className="p-2 text-left">Zoom Link</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((a, idx) => (
                    <tr key={a.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-2">{a.studentName}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          a.type === 'PI' ? 'bg-blue-200 text-blue-800' : 'bg-orange-200 text-orange-800'
                        }`}>
                          {a.type}
                        </span>
                      </td>
                      <td className="p-2">{a.mentorName}</td>
                      <td className="p-2">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="p-2">{a.slot}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={a.zoomLink}
                          onChange={(e) => updateZoomLink(a.id, e.target.value)}
                          placeholder="Add Zoom link"
                          className="text-xs border rounded px-2 py-1 w-full"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedView === 'gd' && gdGroups.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">GD Attendance Tracker</h2>
            <div className="space-y-4">
              {gdGroups.map(gd => (
                <div key={gd.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{gd.id}: {gd.topic}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(gd.date).toLocaleDateString()} | {gd.slot} | Mentor: {gd.mentorName}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {gd.students.map(student => (
                      <div key={student.id} className="flex items-center justify-between border rounded p-2">
                        <span className="text-sm">{student.name}</span>
                        <select
                          value={student.status}
                          onChange={(e) => updateGdStatus(gd.id, student.id, e.target.value)}
                          className="text-xs border rounded px-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="in">IN</option>
                          <option value="out">OUT</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedView === 'mentors' && assignments.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Mentor Time Commitment</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-100">
                    <th className="p-2 text-left">Mentor Name</th>
                    <th className="p-2 text-left">PI Sessions</th>
                    <th className="p-2 text-left">Total Minutes</th>
                    <th className="p-2 text-left">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {getMentorStats().map((stat, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-2">{stat.name}</td>
                      <td className="p-2">{stat.piCount}</td>
                      <td className="p-2">{stat.totalMinutes}</td>
                      <td className="p-2 font-semibold">{(stat.totalMinutes / 60).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorshipDashboard;