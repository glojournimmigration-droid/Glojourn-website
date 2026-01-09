import React from 'react';

const DashboardHeader = ({ user }) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="mb-10">
            <h1 className="font-heading text-3xl font-bold text-primary-navy mb-2">
                {getGreeting()}, <span className="text-accent-gold-dim">{user?.name?.split(' ')[0]}</span>.
            </h1>
            <p className="text-slate-600 max-w-2xl text-lg">
                Manage your immigration journey, upload documents, and track your case status all in one place.
            </p>
        </div>
    );
};

export default DashboardHeader;
