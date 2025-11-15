import { useEffect, useState } from "react";
import API from "../../services/api";
import GroupDetails from "./GroupDetails";
import "./MyGroups.css";
import { UserMinus , Eye} from "lucide-react";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import communityCover from "./defualtCommunityCover.jpg"

function MyGroups() {
  const [groups, setGroups] = useState([]);
  const { t, i18n } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showInviteOnly, setShowInviteOnly] = useState(false);

  // ====== تحديث اتجاه الصفحة تلقائي حسب اللغة ======
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

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
         Swal.fire({
        icon: "success",
        title: t("You left the community successfully!"),
        showConfirmButton: false,
        timer: 1800,
      });
      } else {
       Swal.fire({
        icon: "error",
        title: t(res.data.message || "Failed to leave the community."),
        text: t("Please try again later."),
      });
      }
    } catch {
        Swal.fire({
        icon: "error",
        title: t("Failed to leave the community, please try again."),
        text: t("Please try again later."),
      });
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
        showInviteOnly={showInviteOnly} 
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
              <div className="mycommunity-image-wrapper">
                <img
                  src={g.groupImage || communityCover}
                  alt={g.groupName}
                  className="mycommunity-image"
                />
                <span className="mycommunity-members">
                  {g.membersCount} Members
                </span>
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
