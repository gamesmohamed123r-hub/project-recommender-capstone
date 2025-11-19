import csv
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- إعداد السيرفر ---
app = Flask(__name__)
CORS(app) 

# --- 1. تحميل الداتا من ملف الـ CSV ---
def load_projects_from_csv(filename="projects.csv"):
    projects = []
    script_dir = os.path.dirname(__file__)
    file_path = os.path.join(script_dir, filename)
    
    try:
        
        with open(file_path, mode='r', encoding='ISO-8859-1') as file:
            csv_reader = csv.DictReader(file)
            
            for row in csv_reader:
                
                
                # بيقرأ من عمود "Required_Interests"
                row['required_interests'] = [i.strip() for i in row.get('Required_Interests', '').split(',')]
                # بيقرأ من عمود "Required_Skills"
                row['required_skills'] = [s.strip() for s in row.get('Required_Skills', '').split(',')]
                
                # (*** هنا التعديل ***)
                # بيقرأ من عمود "Project_Name" ويحفظه في "title"
                row['title'] = row.get('Project_Name', '') 
                
                # بيقرأ من عمود "Project_ID"
                try:
                    row['id'] = int(row.get('Project_ID', 0)) 
                except (ValueError, TypeError):
                    row['id'] = 0
                
                projects.append(row)
                
    except FileNotFoundError:
        print(f"Error: The file {file_path} was not found.")
        return []
    except Exception as e:
        # لو حصل أي إيرور تاني، اطبعه
        print(f"An error occurred while loading CSV: {e}")
        return []
        
    return projects

# --- 2. خوارزمية الترشيح (النسخة "الأذكى") ---
# (الدالة دي سليمة 100%)
def calculate_recommendations(user_interests, user_skills, all_projects):
    SKILL_WEIGHT = 0.6
    INTEREST_WEIGHT = 0.4

    user_skills_set = set(user_skills)
    user_interests_set = set(user_interests)
    
    all_scores = []

    for project in all_projects:
        if not project.get('required_skills') or not project.get('required_interests'):
            continue

        project_skills_set = set(project["required_skills"])
        project_interests_set = set(project["required_interests"])
        
        matching_skill_count = 0
        for project_skill in project_skills_set:
            if not project_skill: continue
            for user_skill in user_skills_set:
                if project_skill in user_skill:
                    matching_skill_count += 1
                    break 
        
        skill_score = matching_skill_count / len(project_skills_set) if len(project_skills_set) > 0 else 0
            
        matching_interest_count = 0
        for project_interest in project_interests_set:
            if not project_interest: continue
            for user_interest in user_interests_set:
                if project_interest in user_interest:
                    matching_interest_count += 1
                    break

        interest_score = matching_interest_count / len(project_interests_set) if len(project_interests_set) > 0 else 0

        final_score = (skill_score * SKILL_WEIGHT) + (interest_score * INTEREST_WEIGHT)
        final_percentage = final_score * 100
        
        if final_percentage > 0:
            all_scores.append({
                "id": project["id"],
                "title": project["title"], # <-- هيقرأ الاسم الصح
                "score": final_percentage
            })

    sorted_projects = sorted(all_scores, key=lambda x: x['score'], reverse=True)
    return sorted_projects

# --- 3. نقطة الاتصال (Endpoint) ---
@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    user_interests = data.get('interests', [])
    user_skills = data.get('skills', [])
    
    all_projects = load_projects_from_csv()
    
    if not all_projects:
        return jsonify({"error": "Could not load projects data"}), 500

    recommendations = calculate_recommendations(user_interests, user_skills, all_projects)
    
    return jsonify(recommendations)

# --- 4. تشغيل السيرفر ---
if __name__ == '__main__':
    print("Starting Flask server... (Backend is running at http://127.0.0.1:5000)")
    app.run(debug=True, port=5000)