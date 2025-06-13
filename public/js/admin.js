document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const messagesContainer = document.getElementById('messagesContainer');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const confirmModal = document.getElementById('confirmModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    // Estado global
    let messages = [];
    let messageToDelete = null;
    const authHeader = 'Basic ' + btoa('admin:123');

    // Mostrar notificação
    function showNotification(message, isError = false) {
        notification.className = isError ? 
            'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center' :
            'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center';
        
        notificationText.textContent = message;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }

    // Renderizar mensagens
    function renderMessages(messagesToRender) {
        if (messagesToRender.length === 0) {
            messagesContainer.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="far fa-folder-open text-3xl"></i>
                    <p class="mt-4">Nenhuma mensagem encontrada</p>
                </div>
            `;
            return;
        }

        messagesContainer.innerHTML = messagesToRender.map((message, index) => `
            <div class="message-enter p-6 hover:bg-gray-50" 
                 style="animation-delay: ${index * 50}ms" 
                 data-id="${message.id}">
                <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-lg truncate">${message.name || 'Sem nome'}</h3>
                        <a href="mailto:${message.email}" class="text-blue-500 hover:text-blue-700 text-sm truncate block">
                            ${message.email || 'Sem e-mail'}
                        </a>
                        <div class="mt-2 text-gray-500 text-sm">
                            <i class="far fa-clock mr-1"></i>
                            ${message.created_at || 'Data não disponível'}
                        </div>
                    </div>
                    <button class="delete-btn bg-red-50 text-red-600 px-3 py-1 rounded-lg text-sm hover:bg-red-100 transition self-end">
                        <i class="fas fa-trash-alt mr-1"></i> Excluir
                    </button>
                </div>
                <div class="mt-4 pt-4 border-t">
                    <p class="text-gray-700 whitespace-pre-line">${message.message || 'Sem mensagem'}</p>
                </div>
            </div>
        `).join('');

        // Adicionar event listeners aos botões de exclusão
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const messageElement = e.target.closest('[data-id]');
                messageToDelete = messageElement.getAttribute('data-id');
                confirmModal.classList.remove('hidden');
            });
        });
    }

    // Filtrar e ordenar mensagens (CORREÇÃO PRINCIPAL)
    function filterAndSortMessages() {
        try {
            const searchTerm = searchInput.value.toLowerCase();
            const sortOption = sortSelect.value;
            
            let filteredMessages = [...messages];
            
            if (searchTerm) {
            filteredMessages = filteredMessages.filter(msg =>
                (msg.name && msg.name.toLowerCase().includes(searchTerm)) ||
                (msg.email && msg.email.toLowerCase().includes(searchTerm)) ||
                (msg.message && msg.message.toLowerCase().includes(searchTerm))
            );
        } 
            
            filteredMessages.sort((a, b) => {
                const dateA = new Date(a.created_at || a.createdAt);
                const dateB = new Date(b.created_at || b.createdAt);
                return sortOption === 'newest' ? dateB - dateA : dateA - dateB;
            });
            
            renderMessages(filteredMessages);
        } catch (error) {
            console.error('Erro ao filtrar:', error);
            renderMessages(messages);
        }
    }

    // Carregar mensagens
    async function loadMessages() {
        try {
            messagesContainer.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i>
                    <p class="mt-4 text-gray-600">Carregando mensagens...</p>
                </div>
            `;
            
            const response = await fetch('http://localhost:3000/api/messages', {
                headers: {
                    'Authorization': authHeader
                }
            });
            
            if (!response.ok) throw new Error('Erro ao carregar mensagens');
            
            const result = await response.json();
            messages = result.data || result;
            filterAndSortMessages();
            
        } catch (error) {
            console.error('Erro:', error);
            messagesContainer.innerHTML = `
                <div class="text-center py-12 text-red-500">
                    <i class="fas fa-exclamation-triangle text-3xl"></i>
                    <p class="mt-4">${error.message}</p>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        <i class="fas fa-sync-alt mr-2"></i> Tentar novamente
                    </button>
                </div>
            `;
        }
    }

    // Excluir mensagem
    async function deleteMessage() {
        try {
            const response = await fetch(`http://localhost:3000/api/messages/${messageToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': authHeader
                }
            });
            
            if (!response.ok) throw new Error('Erro ao excluir mensagem');
            
            const result = await response.json();
            showNotification(result.message || 'Mensagem excluída com sucesso');
            await loadMessages();
            
        } catch (error) {
            console.error('Erro:', error);
            showNotification(error.message || 'Erro ao excluir mensagem', true);
        } finally {
            confirmModal.classList.add('hidden');
            messageToDelete = null;
        }
    }

    // Event Listeners
    searchInput.addEventListener('input', filterAndSortMessages);
    sortSelect.addEventListener('change', filterAndSortMessages);
    cancelDelete.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        messageToDelete = null;
    });
    confirmDelete.addEventListener('click', deleteMessage);

    // Carregar mensagens inicialmente
    loadMessages();

    // Recarregar a cada 30 segundos (opcional)
    setInterval(loadMessages, 30000);
});