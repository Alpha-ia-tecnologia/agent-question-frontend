/**
 * API Service - Comunicação com o backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Requisição genérica com injeção automática de token JWT
 */
async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        // Se 401, limpa token e redireciona para login
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
        throw new Error(error.detail || `Erro ${response.status}`);
    }

    // Verifica se a resposta é JSON ou blob (para download)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    return response;
}

// ==========================================
// Agent API - Geração de Questões
// ==========================================

export const agentApi = {
    /**
     * Gera questões educacionais
     */
    async generateQuestions(params) {
        return request('/agent/ask-agent', {
            method: 'POST',
            body: JSON.stringify({
                count_questions: params.countQuestions,
                count_alternatives: params.countAlternatives,
                skill: params.skill,
                proficiency_level: params.proficiencyLevel,
                grade: params.grade,
                authentic: params.authentic || false,
                use_real_text: params.useRealText || false,
                image_dependency: params.imageDependency || 'none',
                model_evaluation_type: params.modelEvaluationType || 'SAEB',
            }),
        });
    },

    /**
     * Gera questões com progresso em tempo real via SSE
     * @param {Object} params - Parâmetros de geração
     * @param {Function} onProgress - Callback chamado a cada evento de progresso
     * @returns {Promise<Object>} Resultado final com questões
     */
    async generateQuestionsStream(params, onProgress) {
        const response = await fetch(`${API_BASE_URL}/agent/ask-agent-stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                count_questions: params.countQuestions,
                count_alternatives: params.countAlternatives,
                skill: params.skill,
                proficiency_level: params.proficiencyLevel,
                grade: params.grade,
                authentic: params.authentic || false,
                use_real_text: params.useRealText || false,
                image_dependency: params.imageDependency || 'none',
                model_evaluation_type: params.modelEvaluationType || 'SAEB',
                curriculum_component: params.curriculumComponent || '',
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: Falha na geração`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let finalResult = null;
        let buffer = '';

        const processLine = (rawLine) => {
            const line = rawLine.replace(/\r/g, '').trim();
            if (!line.startsWith('data: ')) return;

            try {
                const jsonStr = line.slice(6);
                const event = JSON.parse(jsonStr);

                if (event.type !== 'heartbeat') {
                    onProgress(event);
                }
                if (event.type === 'finished') {
                    console.log('[SSE] ✅ Finished event received! Questions:', event.result?.questions?.length);
                    finalResult = event.result;
                }
                if (event.type === 'error') {
                    throw new Error(event.message);
                }
            } catch (e) {
                if (e.message && !e.message.includes('JSON')) throw e;
                console.warn('[SSE] JSON parse error:', rawLine.substring(0, 100));
            }
        };

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer

            for (const line of lines) {
                processLine(line);
            }
        }

        // Process any remaining data in buffer after stream ends
        if (buffer.trim()) {
            console.log('[SSE] Processing remaining buffer:', buffer.substring(0, 80));
            processLine(buffer);
        }

        console.log('[SSE] Stream complete. Result:', finalResult ? `${finalResult.questions?.length} questions` : 'NULL');
        return finalResult;
    },


    /**
     * Gera imagem para uma questão
     */
    async generateImage(question) {
        return request('/agent/ask-image', {
            method: 'POST',
            body: JSON.stringify(question),
        });
    },

    /**
     * Regenera imagem com instruções personalizadas
     */
    async regenerateImage(question, customInstructions) {
        return request('/agent/regenerate-image', {
            method: 'POST',
            body: JSON.stringify({
                question: question,
                custom_instructions: customInstructions,
            }),
        });
    },
};

// ==========================================
// Document API - Exportação
// ==========================================

export const docApi = {
    /**
     * Gera documento DOCX com as questões
     */
    async generateDocx(questions, fileName) {
        return request(`/doc/generate-docx?file_name=${encodeURIComponent(fileName)}`, {
            method: 'POST',
            body: JSON.stringify(questions),
        });
    },

    /**
     * Faz download do documento
     */
    async downloadDocx(fileName) {
        const response = await fetch(`${API_BASE_URL}/doc/download/${fileName}`);

        if (!response.ok) {
            throw new Error('Falha ao baixar documento');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    },
};

// ==========================================
// User API - Gerenciamento de Usuários
// ==========================================

export const userApi = {
    /**
     * Lista usuários
     */
    async list(offset = 0, limit = 10) {
        return request(`/user/?offset=${offset}&limit=${limit}`);
    },

    /**
     * Cria novo usuário
     */
    async create(userData) {
        return request('/user/', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    /**
     * Atualiza usuário
     */
    async update(userId, userData) {
        return request(`/user/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },

    /**
     * Remove usuário
     */
    async delete(userId) {
        return request(`/user/${userId}`, {
            method: 'DELETE',
        });
    },
};

// ==========================================
// Groups API - Grupos de Questões Salvas
// ==========================================

export const groupsApi = {
    /**
     * Lista todos os grupos de questões
     */
    async list(limit = 50, offset = 0) {
        return request(`/api/groups/?limit=${limit}&offset=${offset}`);
    },

    /**
     * Busca um grupo com todas suas questões
     */
    async getWithQuestions(groupId) {
        return request(`/api/groups/${groupId}`);
    },

    /**
     * Remove um grupo e todas suas questões
     */
    async delete(groupId) {
        return request(`/api/groups/${groupId}`, {
            method: 'DELETE',
        });
    },
};

// ==========================================
// Questions API - Questões Individuais
// ==========================================

export const questionsApi = {
    /**
     * Lista questões com filtros
     */
    async list(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.skill) queryParams.append('skill', params.skill);
        if (params.proficiencyLevel) queryParams.append('proficiency_level', params.proficiencyLevel);
        if (params.validated !== undefined && params.validated !== null) queryParams.append('validated', params.validated);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.offset) queryParams.append('offset', params.offset);
        return request(`/api/questions/?${queryParams.toString()}`);
    },

    /**
     * Busca contadores de questões (total, validadas, pendentes)
     */
    async getCounts() {
        return request('/api/questions/counts');
    },

    /**
     * Busca uma questão por ID
     */
    async getById(questionId) {
        return request(`/api/questions/${questionId}`);
    },

    /**
     * Remove uma questão
     */
    async delete(questionId) {
        return request(`/api/questions/${questionId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Atualiza o status de validação de uma questão
     */
    async toggleValidation(questionId, validated) {
        return request(`/api/questions/${questionId}/validate`, {
            method: 'PATCH',
            body: JSON.stringify({ validated }),
        });
    },

    /**
     * Atualiza a observação de uma questão
     */
    async updateObservation(questionId, observation) {
        return request(`/api/questions/${questionId}/observation`, {
            method: 'PATCH',
            body: JSON.stringify({ observation }),
        });
    },
};

// ==========================================
// Auth API - Autenticação
// ==========================================

export const authApi = {
    /**
     * Faz login e armazena o token JWT
     */
    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
            throw new Error(error.detail || 'Falha na autenticação');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        return data;
    },

    /**
     * Faz logout removendo o token
     */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};
