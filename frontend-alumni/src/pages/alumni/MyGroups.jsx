import { useEffect, useState } from "react";
import API from "../../services/api";
import GroupDetails from "./GroupDetails";
import "./MyGroups.css";
import { UserMinus , Eye} from "lucide-react";


function MyGroups() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showInviteOnly, setShowInviteOnly] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await API.get("/groups/my-groups");
        setGroups(res.data.data || []);
      } catch (err) {
        setGroups([]);
      }
    };
    fetchGroups();
  }, []);

  const handleLeave = async (groupId) => {
    try {
      const res = await API.delete(`/groups/leave/${groupId}`);
      if (res.data.status === "success") {
        setGroups(groups.filter((g) => g.id !== groupId));
        alert("You left the community successfully!");
      } else {
        alert(res.data.message || "Failed to leave the community.");
      }
    } catch {
      alert("Failed to leave the community, please try again.");
    }
  };

  const openGroupDetails = (group, inviteOnly = false) => {
    setSelectedGroup(group);
    setShowInviteOnly(inviteOnly);
  };

  if (selectedGroup) {
    return (
      <GroupDetails
        group={selectedGroup}
        goBack={() => setSelectedGroup(null)}
        showInviteOnly={showInviteOnly} // لتفعيل Invite section مباشرة
      />
    );
  }

return (
  <div className="mycommunity-panel">
    <h2 className="uni-header">My Communities</h2>

    {groups.length === 0 ? (
      <p className="mycommunity-empty">No Communities found</p>
    ) : (
      <div className="mycommunity-grid">
        {groups.map((g) => (
          <div key={g.id} className="mycommunity-card">
            {/* صورة الجروب + البادجات + الاسم */}
            <div className="mycommunity-image-wrapper">
              {g.groupImage ? (
                <img
                  src={g.groupImage}
                  alt={g.groupName}
                  className="mycommunity-image"
                />
              ) : (
                <div style={{ height: "160px", background: "#ddd" }}></div>
              )}

              

              {/* عدد الأعضاء */}
              <span className="mycommunity-members">
                {g.membersCount} Members
              </span>

              {/* Invite Badge */}
              <div
                className="myinvite-badge"
                onClick={() => openGroupDetails(g, true)}
              >
                +
                <span className="tooltip-text">
                  Invite people to this community
                </span>
              </div>
            </div>

            {/* أزرار View و Leave */}
            <div className="mycommunity-footer">
  <div className="mycommunity-name">
    {g.groupName}
  </div>
  <div className="mycoomunity-butn">
  <button className="viewgr-btn" onClick={() => openGroupDetails(g)}>
  <Eye size={16} style={{ marginRight: "5px" }} />
  View Details
</button>
  <div
  className="leave-icon"
  onClick={() => handleLeave(g.id)}
  title="Leave group"
>
  <UserMinus size={18} />
</div>
</div>
  
</div>

          </div>
        ))}
      </div>
    )}
  </div>
);

}

export default MyGroups;
