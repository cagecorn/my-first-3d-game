export class LogManager {
    constructor() {
        this.sessionInfo = {
            Campaign_ID: `Campaign_${Date.now()}`,
            Play_Date: new Date().toISOString().split('T')[0],
            Player_Name: "Player" // Default, updated later if needed
        };
        this.logs = [];
        this.hallOfFame = []; // For liked logs
    }

    setPlayerName(name) {
        this.sessionInfo.Player_Name = name;
    }

    addLog(entry) {
        // Auto-fill ID and Timestamp if not provided
        const logId = this.logs.length + 1001;
        const now = new Date();
        const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const fullEntry = {
            Log_ID: logId,
            Timestamp: timestamp,
            ...entry,
            User_Feedback: null // Placeholder for future feedback
        };

        this.logs.push(fullEntry);
        console.log(`[LogManager] Recorded Log #${logId}: ${entry.Trigger_Event}`);
        return logId;
    }

    recordFeedback(logId, isLiked, comment = "") {
        const log = this.logs.find(l => l.Log_ID === logId);
        if (log) {
            log.User_Feedback = {
                Is_Liked: isLiked,
                Comment: comment
            };
            if (isLiked) {
                this.hallOfFame.push(log);
            }
        }
    }

    getLogs() {
        return {
            Session_Info: this.sessionInfo,
            Logs: this.logs
        };
    }

    downloadLogs() {
        const data = this.getLogs();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `Grimoire_Log_${this.sessionInfo.Campaign_ID}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
