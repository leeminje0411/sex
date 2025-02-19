function jailTrigger() {
    document.getElementById("jail1").click();

    // ✅ 상품 수정 시 이미지 미리보기 변경
    document.getElementById("jail1").addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById("profileImagePreview1").src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}
function saveProfileImage() {
    const fileInput = document.getElementById("jail1");
    if (fileInput.files.length === 0) {
        alert("이미지를 선택해주세요!");
        return;
    }

    const formData = new FormData();
    formData.append("image", fileInput.files[0]);

    fetch("/profile/upload", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.querySelectorAll(".profile-img").forEach(img => img.src = data.imageUrl);
                const modalElement = document.getElementById("profileModal");
                const profileModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                profileModal.hide();
            } else {
                alert("변경 실패: " + data.message);
            }
        })
        .catch(error => console.error("프로필 변경 중 오류:", error));
}

function triggerFileUploadEdit() {
    document.getElementById("editProfileImageInput").click();

    document.getElementById("editProfileImageInput").addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById("editProfileImagePreview2").src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

}



//닉네임 및 프로필 이미지 수정 함수
function saveProfileEdit() {
    const fileInput = document.getElementById("editProfileImageInput");
    const nickname = document.getElementById("editNickname").value;
    const bio = document.getElementById("editBio").value;

    if (!nickname.trim()) {
        alert("닉네임을 입력해주세요!");
        return;
    }

    const formData = new FormData();
    formData.append("nickname", nickname);
    formData.append("bio", bio);

    if (fileInput.files.length > 0) {
        formData.append("image", fileInput.files[0]);
    }

    fetch("/profile/edit", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.querySelectorAll(".profile-img").forEach(img => img.src = data.profileImage);
                document.querySelectorAll(".shibal1").forEach((item) => item.innerText = data.username);
                document.querySelector(".shibal2").innerText = data.bio;
                const modalElement = document.getElementById("editProfileModal");
                const editProfileModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                editProfileModal.hide();
            } else {
                alert("변경 실패: " + data.message);
            }
        })
        .catch(error => console.error("프로필 수정 중 오류:", error));
}




document.addEventListener("DOMContentLoaded", function () {
    // ✅ 수정 버튼 클릭 시 상품 데이터 불러오기
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", function () {
            const id = this.getAttribute("data-id");

            if (!id) {
                alert("상품 ID가 없습니다.");
                return;
            }

            fetch('/profile/products/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            })
                .then(response => response.json())
                .then(data => {
                    console.log('데이터 받은거:', data);
                    const product = data.data[0];
                    document.getElementById("editCategory").value = product.category;
                    document.getElementById("editTitle").value = product.title;
                    document.getElementById("editPrice").value = product.price;
                    document.getElementById("editDescription").value = product.description;
                    document.getElementById("editImagePreview").src = product.image_url;
                    document.getElementById("editModal").setAttribute("data-id", product.id);
                })
                .catch(error => console.error("데이터 불러오기 오류:", error));
        });
    });

    const fileInput = document.getElementById("editImage");
    if (fileInput) {
        fileInput.addEventListener("change", function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    document.getElementById("editImagePreview").src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }


    // ✅ 상품 정보 수정 요청
    document.querySelector(".edit-update").addEventListener("click", function () {
        const productId = document.getElementById("editModal").getAttribute("data-id");

        if (!productId) {
            alert("상품 ID가 없습니다.");
            return;
        }

        const formData = new FormData();
        formData.append("id", productId);
        formData.append("category", document.getElementById("editCategory").value);
        formData.append("title", document.getElementById("editTitle").value);
        formData.append("price", document.getElementById("editPrice").value);
        formData.append("description", document.getElementById("editDescription").value);

        const fileInput = document.getElementById("editImage");
        if (fileInput.files.length > 0) {
            formData.append("image", fileInput.files[0]);
        }

        fetch("/profile/products/update", {
            method: "POST",
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("수정이 완료되었습니다!");
                    location.reload();
                } else {
                    alert("수정 실패: " + data.message);
                }
            })
            .catch(error => console.error("수정 중 오류 발생:", error));
    });

    // ✅ 삭제 확인 입력 시 버튼 활성화
    document.getElementById("deleteConfirmInput").addEventListener("input", function () {
        const deleteButton = document.getElementById("confirmDeleteBtn");
        if (this.value.trim() === "삭제합니다") {
            deleteButton.removeAttribute("disabled");
        } else {
            deleteButton.setAttribute("disabled", "true");
        }
    });

    // ✅ 상품 삭제 요청
    document.getElementById("confirmDeleteBtn").addEventListener("click", function () {
        const productId = this.getAttribute("data-id");

        if (!productId) {
            alert("삭제할 상품 ID가 없습니다.");
            return;
        }

        fetch("/profile/products/delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id: productId })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("삭제되었습니다!");
                    location.reload();
                } else {
                    alert("삭제 실패: " + data.message);
                }
            })
            .catch(error => {
                console.error("삭제 중 오류 발생:", error);
                alert("삭제 중 오류가 발생했습니다.");
            });
    });

    // ✅ 프로필 사진 변경 (profileModal)
    document.getElementById("profileImageInput").addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById("profileImagePreview1").src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });





    // ✅ 프로필 편집 모달 (editProfileModal)





});